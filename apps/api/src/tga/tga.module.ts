import { Module } from '@nestjs/common';
import { TgaApiClient } from './tga-api.client';
import { TgaSyncService } from './tga-sync.service';

@Module({
  providers: [TgaApiClient, TgaSyncService],
  exports: [TgaApiClient, TgaSyncService],
})
export class TgaModule {}
