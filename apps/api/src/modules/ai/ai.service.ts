import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ExternalServiceErrorException } from '@/common/exceptions/app.exceptions';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async generateContent(prompt: string): Promise<string> {
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
}
