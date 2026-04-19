import { Body, Controller, Post } from '@nestjs/common';

import { QuizDto } from './dto/quiz.dto';
import { RoadmapService } from './roadmap.service';

@Controller('roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Post('quiz')
  quiz(@Body() dto: QuizDto) {
    return { message: 'Quiz created successfully' };
  }
}
