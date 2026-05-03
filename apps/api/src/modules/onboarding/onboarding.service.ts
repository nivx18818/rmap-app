import { Injectable } from '@nestjs/common';
import { RoleCategory } from '@repo/db/prisma/client';

import { ExternalServiceErrorException } from '@/common/exceptions/app.exceptions';

import type { GoalSuggestion } from './constants/goal-suggestions';

import { AiService } from '../ai/ai.service';
import { GOAL_SUGGESTIONS } from './constants/goal-suggestions';
import { OnboardingQuizRequestDto } from './dto/onboarding-quiz-request.dto';

export interface OnboardingQuizQuestionDto {
  question: string;
  possibleAnswers: string[];
}

export interface OnboardingQuizResultDto {
  roleCategory: string;
  questions: OnboardingQuizQuestionDto[];
}

@Injectable()
export class OnboardingService {
  constructor(private readonly aiService: AiService) {}

  getGoalSuggestions(roleCategory?: string): GoalSuggestion[] {
    if (!roleCategory) {
      return GOAL_SUGGESTIONS;
    }
    return GOAL_SUGGESTIONS.filter(
      (goal) => goal.roleCategory.toLowerCase() === roleCategory.toLowerCase(),
    );
  }

  async generateQuiz(payload: OnboardingQuizRequestDto): Promise<OnboardingQuizResultDto> {
    const roleSlugs = this.getRoleSlugs();
    const responseText = await this.aiService.generateOnboardingQuiz(payload, roleSlugs);
    return this.parseQuizResponse(responseText, roleSlugs);
  }

  private parseQuizResponse(
    responseText: string,
    allowedRoleSlugs: string[],
  ): OnboardingQuizResultDto {
    const jsonText = this.stripMarkdownFences(responseText);
    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new ExternalServiceErrorException('Gemini JSON parse failed for Quiz');
    }

    if (!this.isQuizResponse(parsed)) {
      throw new ExternalServiceErrorException('Gemini response failed schema validation for Quiz');
    }

    const fallbackRole = allowedRoleSlugs[0] ?? 'backend';
    const normalizedRole = this.toRoleCategory(parsed.roleCategory);
    const roleCategory = allowedRoleSlugs.includes(normalizedRole) ? normalizedRole : fallbackRole;

    const normalizedQuestions = parsed.questions.map((question) => ({
      question: question.question,
      possibleAnswers: Array.isArray(question.possibleAnswers) ? question.possibleAnswers : [],
    }));

    return {
      roleCategory,
      questions: normalizedQuestions,
    };
  }

  private isQuizResponse(payload: unknown): payload is OnboardingQuizResultDto {
    if (!payload || typeof payload !== 'object') return false;

    const candidate = payload as OnboardingQuizResultDto;
    if (typeof candidate.roleCategory !== 'string') return false;

    if (!Array.isArray(candidate.questions) || candidate.questions.length === 0) return false;

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

  private getRoleSlugs(): string[] {
    const enumRoles = Object.values(RoleCategory ?? {});
    return Array.from(new Set(enumRoles.map((role) => this.toRoleCategory(role))));
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
