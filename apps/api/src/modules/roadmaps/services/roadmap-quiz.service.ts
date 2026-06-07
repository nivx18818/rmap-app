import { Injectable, Logger } from '@nestjs/common';
import { NodeStatus, QuizGenerationStatus } from '@repo/db/prisma/client';

import {
  InternalServerErrorException,
  NodeQuizGenerationUnavailableException,
  QuizNodeTypeInvalidException,
  QuizSubmissionInvalidException,
  RoadmapNodeNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { SubmitQuizDto } from '../dto/submit-quiz.dto';
import type {
  QuizQuestionPublic,
  RoadmapNodeQuizResponse,
  SubmitQuizResponse,
} from '../types/roadmap-node-quiz.types';

import { delay } from '../utils/async';
import { toNumberOrNull } from '../utils/number';
import {
  assertGeneratedNodeQuiz,
  assertQuizNodeInProgress,
  assertStrictQuizSubmission,
  pickRandomQuizQuestions,
  toQuizOption,
} from '../utils/quiz';
import { getRoadmapRelationAccessWhere } from '../utils/roadmap-access';
import {
  LEAF_NODE_TYPES,
  NODE_QUIZ_QUESTION_COUNT,
  QUIZ_GENERATION_POLL_INTERVAL_MS,
  QUIZ_GENERATION_POLL_TIMEOUT_MS,
  QUIZ_PASSING_SCORE_PCT,
  QUIZ_REVIEW_SUGGESTION,
} from '../utils/roadmap.constants';
import { RoadmapProgressService } from './roadmap-progress.service';

@Injectable()
export class RoadmapQuizService {
  private readonly logger = new Logger(RoadmapQuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly roadmapProgress: RoadmapProgressService,
  ) {}

  async getNodeQuiz(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<RoadmapNodeQuizResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        nodeType: true,
        skillId: true,
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            roleCategory: true,
            quizGenerationStatus: true,
          },
        },
        userNodeProgress: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skillId) {
      throw new QuizNodeTypeInvalidException();
    }

    assertQuizNodeInProgress(node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED);

    if (!node.skill) {
      throw new InternalServerErrorException('Skill catalog entry is missing for this node');
    }

    const storedQuestions = await this.findReadyPublicQuizQuestions(node.skillId);
    const questions =
      storedQuestions ?? (await this.generateOrWaitForNodeQuizQuestions(node.skill));

    return {
      nodeId: node.id,
      skillId: node.skillId,
      questions,
    };
  }

  async submitNodeQuiz(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: SubmitQuizDto,
  ): Promise<SubmitQuizResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        nodeType: true,
        skillId: true,
        userNodeProgress: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skillId) {
      throw new QuizNodeTypeInvalidException();
    }

    assertQuizNodeInProgress(node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED);
    assertStrictQuizSubmission(dto.answers);

    const submittedQuestionIds = dto.answers.map((answer) => answer.questionId);
    const questions = await this.prisma.quizQuestion.findMany({
      where: {
        id: { in: submittedQuestionIds },
        skillId: node.skillId,
      },
      select: {
        id: true,
        correctOption: true,
      },
    });

    const questionById = new Map(questions.map((question) => [question.id, question]));

    if (
      questions.length !== NODE_QUIZ_QUESTION_COUNT ||
      submittedQuestionIds.some((questionId) => !questionById.has(questionId))
    ) {
      throw new QuizSubmissionInvalidException('Quiz submission contains unknown question answers');
    }

    const answerByQuestionId = new Map(
      dto.answers.map((answer) => [answer.questionId, answer.selectedOption.toUpperCase()]),
    );
    const results = dto.answers.map((answer) => {
      const question = questionById.get(answer.questionId)!;
      const selectedOption = answerByQuestionId.get(answer.questionId)!;
      const correctOption = question.correctOption.toUpperCase();

      return {
        questionId: answer.questionId,
        selectedOption: toQuizOption(selectedOption),
        correctOption: toQuizOption(correctOption),
        isCorrect: selectedOption === correctOption,
      };
    });
    const correctCount = results.filter((result) => result.isCorrect).length;
    const totalQuestions = questions.length;
    const scorePct = (correctCount / totalQuestions) * 100;
    const passed = scorePct >= QUIZ_PASSING_SCORE_PCT;

    const { unlockedNodes, updatedProgress } = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedNodeProgress = await tx.userNodeProgress.update({
        where: {
          userId_roadmapNodeId: {
            userId,
            roadmapNodeId: node.id,
          },
        },
        data: {
          status: passed ? NodeStatus.COMPLETED : NodeStatus.IN_PROGRESS,
          ...(passed ? { completedAt: now } : {}),
          quizScorePct: scorePct,
          quizPassed: passed,
        },
        select: {
          id: true,
          roadmapNodeId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          quizScorePct: true,
          quizPassed: true,
        },
      });

      const unlockedNodeIds = passed
        ? await this.roadmapProgress.applyCompletionSideEffects(userId, node.id, roadmapId, now, tx)
        : [];

      return { unlockedNodes: unlockedNodeIds, updatedProgress: updatedNodeProgress };
    });

    return {
      scorePct,
      passed,
      correctCount,
      totalQuestions,
      results,
      nodeProgress: {
        id: updatedProgress.id,
        roadmapNodeId: updatedProgress.roadmapNodeId,
        status: updatedProgress.status,
        startedAt: updatedProgress.startedAt,
        completedAt: updatedProgress.completedAt,
        quizScorePct: toNumberOrNull(updatedProgress.quizScorePct),
        quizPassed: updatedProgress.quizPassed,
      },
      unlockedNodes,
      suggestion: passed ? null : QUIZ_REVIEW_SUGGESTION,
    };
  }

  private async findReadyPublicQuizQuestions(
    skillId: string,
  ): Promise<QuizQuestionPublic[] | null> {
    const questionCount = await this.prisma.quizQuestion.count({ where: { skillId } });

    if (questionCount < NODE_QUIZ_QUESTION_COUNT) {
      return null;
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { skillId },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    if (questions.length < NODE_QUIZ_QUESTION_COUNT) {
      return null;
    }

    return pickRandomQuizQuestions(
      questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
      })),
    );
  }

  private async generateOrWaitForNodeQuizQuestions(skill: {
    description: null | string;
    id: string;
    name: string;
    quizGenerationStatus: QuizGenerationStatus;
    roleCategory: null | string;
  }): Promise<QuizQuestionPublic[]> {
    if (skill.quizGenerationStatus === QuizGenerationStatus.GENERATING) {
      return this.waitForNodeQuizQuestions(skill.id);
    }

    const generationGuard = await this.prisma.skill.updateMany({
      where: {
        id: skill.id,
        quizGenerationStatus: { not: QuizGenerationStatus.GENERATING },
      },
      data: {
        quizGeneratedAt: null,
        quizGenerationStartedAt: new Date(),
        quizGenerationStatus: QuizGenerationStatus.GENERATING,
      },
    });

    if (generationGuard.count === 0) {
      return this.waitForNodeQuizQuestions(skill.id);
    }

    try {
      await this.generateAndStoreNodeQuiz(skill);
      const questions = await this.findReadyPublicQuizQuestions(skill.id);

      if (!questions) {
        throw new Error('Generated node quiz was not available after persistence');
      }

      return questions;
    } catch (err) {
      await this.markNodeQuizGenerationFailed(skill.id);
      this.logger.error(`Failed to generate node quiz for skill ${skill.id}`, err);
      throw new NodeQuizGenerationUnavailableException();
    }
  }

  private async generateAndStoreNodeQuiz(skill: {
    description: null | string;
    id: string;
    name: string;
    roleCategory: null | string;
  }): Promise<void> {
    const generatedQuestions = await this.aiService.generateNodeQuiz({
      description: skill.description,
      name: skill.name,
      roleCategory: skill.roleCategory,
    });
    assertGeneratedNodeQuiz(generatedQuestions);

    await this.prisma.$transaction([
      this.prisma.quizQuestion.deleteMany({ where: { skillId: skill.id } }),
      this.prisma.quizQuestion.createMany({
        data: generatedQuestions.map((question) => ({
          skillId: skill.id,
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
        })),
      }),
      this.prisma.skill.update({
        where: { id: skill.id },
        data: {
          quizGeneratedAt: new Date(),
          quizGenerationStartedAt: null,
          quizGenerationStatus: QuizGenerationStatus.READY,
        },
      }),
    ]);
  }

  private async waitForNodeQuizQuestions(skillId: string): Promise<QuizQuestionPublic[]> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= QUIZ_GENERATION_POLL_TIMEOUT_MS) {
      const questions = await this.findReadyPublicQuizQuestions(skillId);

      if (questions) {
        return questions;
      }

      await delay(QUIZ_GENERATION_POLL_INTERVAL_MS);
    }

    throw new NodeQuizGenerationUnavailableException();
  }

  private async markNodeQuizGenerationFailed(skillId: string): Promise<void> {
    try {
      await this.prisma.skill.update({
        where: { id: skillId },
        data: {
          quizGenerationStartedAt: null,
          quizGenerationStatus: QuizGenerationStatus.FAILED,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to mark node quiz generation failed for skill ${skillId}`, err);
    }
  }
}
