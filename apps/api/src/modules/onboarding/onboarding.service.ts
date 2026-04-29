import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleCategory } from '@repo/db/prisma/client';

import { ExternalServiceErrorException } from '@/common/exceptions/app.exceptions';

import type { GoalSuggestion } from './constants/goal-suggestions';

import { PrismaService } from '../prisma/prisma.service';
import { GOAL_SUGGESTIONS } from './constants/goal-suggestions';
import { OnboardingQuizRequestDto } from './dto/onboarding.dto';

export interface QuizQuestion {
  question: string;
  possibleAnswers: string[];
}

export interface OnboardingQuizResponse {
  role_category: string;
  estimated_intensity: 'High' | 'Medium' | 'Low';
  questions: QuizQuestion[];
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getGoalSuggestions(roleCategory?: string): GoalSuggestion[] {
    if (!roleCategory) {
      return GOAL_SUGGESTIONS;
    }
    return GOAL_SUGGESTIONS.filter(
      (goal) => goal.roleCategory.toLowerCase() === roleCategory.toLowerCase(),
    );
  }

  async generateQuiz(payload: OnboardingQuizRequestDto): Promise<OnboardingQuizResponse> {
    const roleSlugs = await this.getRoleSlugs();
    const prompt = this.buildPrompt(payload, roleSlugs);
    const responseText = await this.callGemini(prompt);
    const quiz = this.parseQuizResponse(responseText, roleSlugs);

    return quiz;
  }

  private async getRoleSlugs(): Promise<string[]> {
    const roleCategories = await this.prisma.skill.findMany({
      where: { roleCategory: { not: null } },
      distinct: ['roleCategory'],
      select: { roleCategory: true },
    });

    const dbRoles = roleCategories
      .map((role) => role.roleCategory)
      .filter((role): role is RoleCategory => role !== null);

    const roles = dbRoles.length > 0 ? dbRoles : Object.values(RoleCategory);

    return Array.from(new Set(roles.map((role) => role.toLowerCase())));
  }

  private buildPrompt(payload: OnboardingQuizRequestDto, roleSlugs: string[]): string {
    const timeText = this.formatTimeBudget(payload);

    return [
      'You are a learning roadmap specialist.',
      `INPUT: Topic: "${payload.topic}"`,
      `Time budget: ${timeText}.`,
      'TASK:',
      `1) Map the topic into exactly one role category from: [${roleSlugs.join(', ')}].`,
      '2) Generate a profiling quiz with 6-10 questions.',
      'Required question structure:',
      '- Q1: Primary goal (career, project, or career switch).',
      '- Q2: Preferred tech/language (example: Node.js vs Python for Backend).',
      '- Q3-4: Self-assessed skill level (Beginner to Advanced).',
      '- Q5: Biggest fear or focus area (example: security, logic, or UI).',
      '- Q6: Open-ended extra requirements (possibleAnswers must be []).',
      'Flexibility: add 1-2 role-specific questions based on the topic.',
      'Output JSON only, no markdown fences, with this shape:',
      '{ "role_category": "...", "estimated_intensity": "High|Medium|Low", "questions":',
      '[ { "question": "...", "possibleAnswers": ["A", "B", "C", "D"] } ] }',
    ].join('\n');
  }

  private formatTimeBudget(payload: OnboardingQuizRequestDto): string {
    const hoursPerDay = payload.hoursPerDay
      ? `${payload.hoursPerDay} hours/day`
      : 'hours/day not provided';
    const durationMonths = payload.durationMonths
      ? `${payload.durationMonths} months`
      : 'duration not provided';

    return `${hoursPerDay} for ${durationMonths}`;
  }

  private async callGemini(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const model = this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';

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
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new ExternalServiceErrorException('Gemini');
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      throw new ExternalServiceErrorException('Gemini');
    }

    return text;
  }

  private parseQuizResponse(
    responseText: string,
    allowedRoleSlugs: string[],
  ): OnboardingQuizResponse {
    const jsonText = this.extractJson(responseText);
    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new ExternalServiceErrorException('Gemini');
    }

    if (!this.isQuizResponse(parsed)) {
      throw new ExternalServiceErrorException('Gemini');
    }

    const fallbackRole = allowedRoleSlugs[0] ?? 'backend';
    const roleCategory = allowedRoleSlugs.includes(parsed.role_category)
      ? parsed.role_category
      : fallbackRole;

    const normalizedQuestions = parsed.questions.map((question) => ({
      question: question.question,
      possibleAnswers: Array.isArray(question.possibleAnswers) ? question.possibleAnswers : [],
    }));

    return {
      role_category: roleCategory,
      estimated_intensity: parsed.estimated_intensity,
      questions: normalizedQuestions,
    };
  }

  private extractJson(text: string): string {
    const trimmed = text.trim();

    if (trimmed.startsWith('```')) {
      return trimmed
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim();
    }

    return trimmed;
  }

  private isQuizResponse(payload: unknown): payload is OnboardingQuizResponse {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as OnboardingQuizResponse;
    const validIntensity = new Set(['High', 'Medium', 'Low']);

    if (typeof candidate.role_category !== 'string') {
      return false;
    }

    if (!validIntensity.has(candidate.estimated_intensity)) {
      return false;
    }

    if (!Array.isArray(candidate.questions) || candidate.questions.length === 0) {
      return false;
    }

    return candidate.questions.every(
      (question) =>
        typeof question.question === 'string' &&
        Array.isArray(question.possibleAnswers) &&
        question.possibleAnswers.every((answer) => typeof answer === 'string'),
    );
  }
}
