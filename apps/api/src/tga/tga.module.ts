import { Module } from '@nestjs/common';
import { TgaApiClient } from './tga-api.client';
import { TgaSyncService } from './tga-sync.service';
import { TgaSchedulerService } from './tga-scheduler.service';
import { TgaController } from './tga.controller';

@Module({
  controllers: [TgaController],
  providers: [TgaApiClient, TgaSyncService, TgaSchedulerService],
  exports: [TgaApiClient, TgaSyncService],
})
export class TgaModule {}
