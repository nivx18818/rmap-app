import { NodeStatus } from '@repo/db/prisma/client';

import type { GeneratedNodeQuizQuestion } from '@/modules/ai/ai.service';

import {
  QuizNodeNotInProgressException,
  QuizSubmissionInvalidException,
} from '@/common/exceptions/app.exceptions';

import type { SubmitQuizDto } from '../dto/submit-quiz.dto';
import type { QuizOption } from '../types/roadmap-node-quiz.types';

import { NODE_QUIZ_BANK_QUESTION_COUNT, NODE_QUIZ_QUESTION_COUNT } from './roadmap.constants';

export const toQuizOption = (value: string): QuizOption => value.toLowerCase() as QuizOption;

export const pickRandomQuizQuestions = <T>(questions: T[]): T[] => {
  const shuffledQuestions = [...questions];

  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const question = shuffledQuestions[index]!;
    shuffledQuestions[index] = shuffledQuestions[swapIndex]!;
    shuffledQuestions[swapIndex] = question;
  }

  return shuffledQuestions.slice(0, NODE_QUIZ_QUESTION_COUNT);
};

export const assertStrictQuizSubmission = (answers: SubmitQuizDto['answers']): void => {
  if (answers.length !== NODE_QUIZ_QUESTION_COUNT) {
    throw new QuizSubmissionInvalidException('Quiz submission must include exactly 5 answers');
  }

  const submittedQuestionIds = answers.map((answer) => answer.questionId);
  const uniqueSubmittedQuestionIds = new Set(submittedQuestionIds);

  if (uniqueSubmittedQuestionIds.size !== submittedQuestionIds.length) {
    throw new QuizSubmissionInvalidException('Quiz submission contains duplicate question answers');
  }
};

export const assertQuizNodeInProgress = (status: NodeStatus): void => {
  if (status === NodeStatus.IN_PROGRESS) return;

  throw new QuizNodeNotInProgressException();
};

export const assertGeneratedNodeQuiz = (questions: GeneratedNodeQuizQuestion[]): void => {
  if (questions.length !== NODE_QUIZ_BANK_QUESTION_COUNT) {
    throw new Error(`Expected ${NODE_QUIZ_BANK_QUESTION_COUNT} generated quiz questions`);
  }

  for (const question of questions) {
    const fields = [
      question.questionText,
      question.optionA,
      question.optionB,
      question.optionC,
      question.optionD,
      question.correctOption,
    ];

    if (!fields.every((field) => field.trim().length > 0)) {
      throw new Error('Generated quiz question contains an empty field');
    }

    if (!['A', 'B', 'C', 'D'].includes(question.correctOption)) {
      throw new Error('Generated quiz question contains an invalid correct option');
    }
  }
};
