import { Injectable } from '@nestjs/common';
import { RoleCategory } from '@repo/db/prisma/client';

import { ExternalServiceErrorException } from '@/common/exceptions/app.exceptions';

import type { GoalSuggestion } from './constants/goal-suggestions';

import { GeminiService } from '../gemini/gemini.service';
import { GOAL_SUGGESTIONS } from './constants/goal-suggestions';
import { OnboardingQuizRequestDto } from './dto/onboarding.dto';

export interface QuizQuestion {
  question: string;
  possibleAnswers: string[];
}

export interface OnboardingQuizResponse {
  role_category: string;
  hoursPerDay: number | null;
  durationMonths: number | null;
  questions: QuizQuestion[];
}

@Injectable()
export class OnboardingService {
  constructor(private readonly geminiService: GeminiService) {}

  getGoalSuggestions(roleCategory?: string): GoalSuggestion[] {
    if (!roleCategory) {
      return GOAL_SUGGESTIONS;
    }
    return GOAL_SUGGESTIONS.filter(
      (goal) => goal.roleCategory.toLowerCase() === roleCategory.toLowerCase(),
    );
  }

  async generateQuiz(payload: OnboardingQuizRequestDto): Promise<OnboardingQuizResponse> {
    const roleSlugs = this.getRoleSlugs();
    const prompt = this.buildPrompt(payload, roleSlugs);
    const responseText = await this.geminiService.generateContent(prompt);
    const quiz = this.parseQuizResponse(responseText, roleSlugs, payload);

    return quiz;
  }

  private getRoleSlugs(): string[] {
    const enumRoles = Object.values(RoleCategory ?? {});
    return Array.from(new Set(enumRoles.map((role) => this.toRoleCategory(role))));
  }

  private buildPrompt(payload: OnboardingQuizRequestDto, roleSlugs: string[]): string {
    return [
      'You are a learning roadmap specialist.',
      `INPUT: Topic: "${payload.topic}"`,
      `hoursPerDay: ${payload.hoursPerDay ?? 'null'}`,
      `durationMonths: ${payload.durationMonths ?? 'null'}`,
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
      'Return role_category as a lowercase slug using hyphens (example: "full-stack").',
      'Output JSON only, no markdown fences, with this shape:',
      '{ "role_category": "...", "hoursPerDay": number|null, "durationMonths": number|null, "questions":',
      '[ { "question": "...", "possibleAnswers": ["A", "B", "C", "D"] } ] }',
    ].join('\n');
  }

  private parseQuizResponse(
    responseText: string,
    allowedRoleSlugs: string[],
    payload: OnboardingQuizRequestDto,
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
    const normalizedRole = this.toRoleCategory(parsed.role_category);
    const roleCategory = allowedRoleSlugs.includes(normalizedRole) ? normalizedRole : fallbackRole;

    const normalizedQuestions = parsed.questions.map((question) => ({
      question: question.question,
      possibleAnswers: Array.isArray(question.possibleAnswers) ? question.possibleAnswers : [],
    }));

    return {
      role_category: roleCategory,
      hoursPerDay: payload.hoursPerDay ?? null,
      durationMonths: payload.durationMonths ?? null,
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
    if (typeof candidate.role_category !== 'string') {
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

  private toRoleCategory(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
