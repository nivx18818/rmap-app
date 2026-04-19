import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { QuizDto } from './dto/quiz.dto';
import { RoadmapService } from './roadmap.service';

@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Public()
  @Post('quiz')
  @HttpCode(HttpStatus.OK)
  quiz(@Body() dto: QuizDto) {
    return this.roadmapService.generateQuiz(dto);
  }
}
