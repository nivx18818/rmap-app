import { Controller, Get } from '@nestjs/common';

import { Public } from '@/common/decorators/public.decorator';

import type { SyncVersionResponseDto } from './dto/sync-version-response.dto';

import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Public()
  @Get('version')
  async getVersions(): Promise<SyncVersionResponseDto> {
    return this.syncService.getVersions();
  }
}
