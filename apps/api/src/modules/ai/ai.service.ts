import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AI_PROMPTS } from '@/common/constants/ai-prompts.constant';
import {
  ExternalServiceErrorException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';

import type { OnboardingQuizRequestDto } from '../onboarding/dto/onboarding-quiz-request.dto';
import type { GenerateRoadmapInput } from '../roadmaps/types/ai-roadmap.types';

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
    const prompt = AI_PROMPTS.getOnboardingQuizPrompt(payload.topic, roleSlugs);
    const responseText = await this.generateContent(prompt);

    this.logger.log('AI quiz generated successfully', responseText);
    return responseText;
  }

  async generateRoadmap(input: GenerateRoadmapInput): Promise<string> {
    const prompt = AI_PROMPTS.getRoadmapGenerationPrompt(input);

    let responseText: string;
    try {
      responseText = await this.generateContent(prompt, {
        temperature: 0.7,
      });
      this.logger.log('AI roadmap generated successfully', responseText);
    } catch (err) {
      this.logger.error('Gemini generateContent failed for Roadmap', err);
      throw new RoadmapGenerationUnavailableException();
    }

    return responseText;
  }
}
