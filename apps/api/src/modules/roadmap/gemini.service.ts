import { GoogleGenAI } from '@google/genai';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface GeminiQuizResponse {
  role_slug: string;
  questions: QuizQuestion[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    this.client = new GoogleGenAI({ apiKey });
    this.model = this.configService.get<string>('GEMINI_MODEL', 'gemini-2.0-flash');
  }

  async generateQuiz(
    topic: string,
    hoursPerDay: number,
    months: number,
    availableRoleSlugs: string[],
  ): Promise<GeminiQuizResponse> {
    const prompt = this.buildPrompt(topic, hoursPerDay, months, availableRoleSlugs);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = JSON.parse(text) as GeminiQuizResponse;

      if (!availableRoleSlugs.includes(parsed.role_slug)) {
        this.logger.warn(`Gemini returned invalid role_slug: ${parsed.role_slug}`);
        throw new InternalServerErrorException('AI returned an invalid role. Please try again.');
      }

      if (parsed.questions.length < 6 || parsed.questions.length > 10) {
        throw new InternalServerErrorException('AI returned invalid number of questions.');
      }

      return parsed;
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      this.logger.error('Gemini API error', error);
      throw new InternalServerErrorException('Failed to generate quiz. Please try again.');
    }
  }

  private buildPrompt(
    topic: string,
    hoursPerDay: number,
    months: number,
    availableRoleSlugs: string[],
  ): string {
    return `
You are a technical career advisor. Based on the user's input, do TWO things in one response:

1. Determine the best matching role slug from this exact list: [${availableRoleSlugs.join(', ')}]
2. Generate 6-10 multiple choice questions to assess their current knowledge level for that role.

User input:
- Topic of interest: "${topic}"
- Available study time: ${hoursPerDay} hours/day
- Time horizon: ${months} months

Rules:
- role_slug MUST be exactly one value from the provided list
- Generate between 6 and 10 questions
- Each question must have exactly 4 options (A, B, C, D)
- correctAnswer must be 'A', 'B', 'C', or 'D'
- Questions should assess practical knowledge, not just definitions
- Questions should be relevant to the role and appropriate for the time commitment

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{
  "role_slug": "one-of-the-provided-slugs",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
      "correctAnswer": "A"
    }
  ]
}
    `.trim();
  }
}
