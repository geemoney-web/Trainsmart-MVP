import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  ConflictException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { TgaSchedulerService } from './tga-scheduler.service';
import { TgaSyncService } from './tga-sync.service';
import { TgaApiClient } from './tga-api.client';

@Controller('tga')
export class TgaController {
  constructor(
    private readonly scheduler: TgaSchedulerService,
    private readonly syncService: TgaSyncService,
    private readonly tgaApiClient: TgaApiClient,
  ) {}

  @Post('sync/trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync(@Req() req: Request) {
    const userId = (req.user as any)?.sub ?? 'unknown';
    try {
      return await this.scheduler.triggerManualSync(userId);
    } catch (error: any) {
      if (error.message === 'A sync is already running') {
        throw new ConflictException('A sync is already in progress');
      }
      throw error;
    }
  }

  @Get('sync/status/:syncLogId')
  async getSyncStatus(@Param('syncLogId') syncLogId: string) {
    try {
      return await this.syncService.getSyncStatus(syncLogId);
    } catch {
      throw new NotFoundException('Sync log not found');
    }
  }

  @Get('sync/history')
  async getSyncHistory() {
    return this.syncService.getSyncHistory(10);
  }

  @Get('qualifications/search')
  async searchQualifications(@Req() req: Request) {
    const query = (req.query['q'] as string) ?? '';
    if (!query || query.length < 2) return [];
    return this.tgaApiClient.searchQualifications(query);
  }
}
