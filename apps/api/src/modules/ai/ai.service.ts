import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  getMilestoneTestSuiteGenerationPrompt,
  getNodeQuizGenerationPrompt,
  getOnboardingQuizPrompt,
  getRoadmapGenerationPrompt,
} from '@/common/constants/prompts';
import {
  ExternalServiceErrorException,
  MilestoneTestSuiteGenerationUnavailableException,
  NodeQuizGenerationUnavailableException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';

import type { OnboardingQuizRequestDto } from '../onboarding/dto/onboarding-quiz-request.dto';
import type { GenerateRoadmapInput } from '../roadmaps/types/ai-roadmap.types';

export interface GenerateNodeQuizInput {
  description: null | string;
  name: string;
  roleCategory: null | string;
}

export interface GeneratedNodeQuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export interface GenerateMilestoneTestSuiteInput {
  name: string;
  projectBrief: string;
  roleCategory: null | string;
}

export interface GeneratedMilestoneTestCase {
  description: string;
  name: string;
}

export interface GeneratedMilestoneTestSuite {
  summary: string;
  testCases: GeneratedMilestoneTestCase[];
  testFileContent: string;
  title: string;
}

interface GeneratedNodeQuizPayload {
  questions: GeneratedNodeQuizQuestion[];
}

type GeneratedMilestoneTestSuitePayload = GeneratedMilestoneTestSuite;

const NODE_QUIZ_GENERATION_QUESTION_COUNT = 8;
const MILESTONE_TEST_SUITE_CASE_COUNT = 6;
const MILESTONE_RESULT_MARKER = 'RMAP_MILESTONE_RESULTS:';
const VALID_NODE_QUIZ_OPTIONS = new Set(['A', 'B', 'C', 'D']);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateContent(prompt: string, options?: { temperature?: number }): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-3-flash-preview';

    if (!apiKey) {
      throw new ExternalServiceErrorException('Gemini');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: options?.temperature ?? 0.4,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      this.logger.error('Gemini API returned an error', await response.text());
      throw new ExternalServiceErrorException('Gemini HTTP error');
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      throw new ExternalServiceErrorException('Gemini returned empty response');
    }

    return text;
  }

  async generateOnboardingQuiz(
    payload: OnboardingQuizRequestDto,
    roleSlugs: string[],
  ): Promise<string> {
    const prompt = getOnboardingQuizPrompt(payload.topic, roleSlugs);
    const responseText = await this.generateContent(prompt);

    this.logger.log('AI quiz generated successfully', responseText);
    return responseText;
  }

  async generateNodeQuiz(input: GenerateNodeQuizInput): Promise<GeneratedNodeQuizQuestion[]> {
    const prompt = getNodeQuizGenerationPrompt(input);

    try {
      const responseText = await this.generateContent(prompt, { temperature: 0.2 });
      const payload = this.parseNodeQuizResponse(responseText);

      this.logger.log(
        `AI node quiz generated successfully for skill "${input.name}" with ` +
          `${payload.questions.length} questions`,
      );
      return payload.questions;
    } catch (err) {
      this.logger.error(`Gemini generateContent failed for node quiz skill "${input.name}"`, err);
      throw new NodeQuizGenerationUnavailableException();
    }
  }

  async generateMilestoneTestSuite(
    input: GenerateMilestoneTestSuiteInput,
  ): Promise<GeneratedMilestoneTestSuite> {
    const prompt = getMilestoneTestSuiteGenerationPrompt(input);

    try {
      const responseText = await this.generateContent(prompt, { temperature: 0.2 });
      const payload = this.parseMilestoneTestSuiteResponse(responseText);

      this.logger.log(
        `AI milestone test suite generated successfully for milestone "${input.name}"`,
      );
      return payload;
    } catch (err) {
      this.logger.error(
        `Gemini generateContent failed for milestone test suite "${input.name}"`,
        err,
      );
      throw new MilestoneTestSuiteGenerationUnavailableException();
    }
  }

  async generateRoadmap(input: GenerateRoadmapInput): Promise<string> {
    const prompt = getRoadmapGenerationPrompt(input);

    let responseText: string;
    try {
      responseText = await this.generateContent(prompt, {
        temperature: 0.5,
      });
      this.logger.log('AI roadmap generated successfully', responseText);
    } catch (err) {
      this.logger.error('Gemini generateContent failed for Roadmap', err);
      throw new RoadmapGenerationUnavailableException();
    }

    return responseText;
  }

  private parseNodeQuizResponse(responseText: string): GeneratedNodeQuizPayload {
    let parsed: unknown;

    try {
      parsed = JSON.parse(this.stripMarkdownFences(responseText));
    } catch {
      throw new Error('Node quiz AI response is not valid JSON');
    }

    if (!this.isValidNodeQuizPayload(parsed)) {
      throw new Error('Node quiz AI response failed validation');
    }

    return parsed;
  }

  private parseMilestoneTestSuiteResponse(
    responseText: string,
  ): GeneratedMilestoneTestSuitePayload {
    let parsed: unknown;

    try {
      parsed = JSON.parse(this.stripMarkdownFences(responseText));
    } catch {
      throw new Error('Milestone test suite AI response is not valid JSON');
    }

    if (!this.isValidMilestoneTestSuitePayload(parsed)) {
      throw new Error('Milestone test suite AI response failed validation');
    }

    return parsed;
  }

  private isValidNodeQuizPayload(payload: unknown): payload is GeneratedNodeQuizPayload {
    if (!payload || typeof payload !== 'object') return false;

    const candidate = payload as { questions?: unknown };
    if (!Array.isArray(candidate.questions)) return false;
    if (candidate.questions.length !== NODE_QUIZ_GENERATION_QUESTION_COUNT) return false;

    const questionTexts = new Set<string>();

    for (const question of candidate.questions) {
      if (!this.isValidNodeQuizQuestion(question)) return false;

      const normalizedQuestionText = question.questionText.trim().toLowerCase();
      if (questionTexts.has(normalizedQuestionText)) return false;
      questionTexts.add(normalizedQuestionText);
    }

    return true;
  }

  private isValidMilestoneTestSuitePayload(
    payload: unknown,
  ): payload is GeneratedMilestoneTestSuitePayload {
    if (!payload || typeof payload !== 'object') return false;

    const candidate = payload as Partial<Record<keyof GeneratedMilestoneTestSuitePayload, unknown>>;
    const { summary, testCases, testFileContent, title } = candidate;

    if (!this.isNonEmptyString(title)) return false;
    if (!this.isNonEmptyString(summary)) return false;
    if (!this.isNonEmptyString(testFileContent)) return false;
    if (!testFileContent.includes(MILESTONE_RESULT_MARKER)) return false;
    if (testFileContent.trim().startsWith('```')) return false;
    if (!Array.isArray(testCases)) return false;
    if (testCases.length !== MILESTONE_TEST_SUITE_CASE_COUNT) return false;

    const testCaseNames = new Set<string>();

    for (const testCase of testCases) {
      if (!this.isValidMilestoneTestCase(testCase)) return false;

      const normalizedName = testCase.name.trim().toLowerCase();
      if (testCaseNames.has(normalizedName)) return false;
      testCaseNames.add(normalizedName);
    }

    return true;
  }

  private isValidNodeQuizQuestion(question: unknown): question is GeneratedNodeQuizQuestion {
    if (!question || typeof question !== 'object') return false;

    const candidate = question as Partial<Record<keyof GeneratedNodeQuizQuestion, unknown>>;
    const { questionText, optionA, optionB, optionC, optionD, correctOption } = candidate;
    const textFields = [questionText, optionA, optionB, optionC, optionD];

    if (!textFields.every((field) => typeof field === 'string' && field.trim().length > 0)) {
      return false;
    }

    if (typeof correctOption !== 'string') return false;
    if (!VALID_NODE_QUIZ_OPTIONS.has(correctOption)) return false;

    const optionTexts = [optionA, optionB, optionC, optionD].map((option) =>
      (option as string).trim().toLowerCase(),
    );

    return new Set(optionTexts).size === optionTexts.length;
  }

  private isValidMilestoneTestCase(testCase: unknown): testCase is GeneratedMilestoneTestCase {
    if (!testCase || typeof testCase !== 'object') return false;

    const candidate = testCase as Partial<Record<keyof GeneratedMilestoneTestCase, unknown>>;

    return this.isNonEmptyString(candidate.name) && this.isNonEmptyString(candidate.description);
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('```')) {
      return trimmed
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim();
    }
    return trimmed;
  }
}
