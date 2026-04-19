import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';

import { PrismaService } from '../prisma/prisma.service';
import { QuizDto } from './dto/quiz.dto';
import { GeminiService, QuizQuestion } from './gemini.service';

export interface QuizResponse {
  session_id: string;
  questions: QuizQuestion[];
}

@Injectable()
export class RoadmapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getRoleSlugs(): Promise<string[]> {
    const roles = await this.prisma.role.findMany({
      select: { slug: true },
    });
    return roles.map((r) => r.slug);
  }

  async generateQuiz(dto: QuizDto): Promise<QuizResponse> {
    const availableSlugs = await this.getRoleSlugs();

    const { role_slug, questions } = await this.geminiService.generateQuiz(
      dto.topic,
      dto.hoursPerDay,
      dto.months,
      availableSlugs,
    );

    const session_id = await this.jwtService.signAsync(
      {
        role_slug,
        topic: dto.topic,
        hoursPerDay: dto.hoursPerDay,
        months: dto.months,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '30m',
      },
    );

    return { session_id, questions };
  }
}
