import { Controller, Get } from '@nestjs/common';

import { Public } from './common/decorators/public.decorator';

type HealthResponse = {
  status: 'ok';
};

@Controller()
export class AppController {
  @Public()
  @Get('health')
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
