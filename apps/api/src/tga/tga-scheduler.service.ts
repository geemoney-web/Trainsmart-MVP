import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TgaSyncService } from './tga-sync.service';

@Injectable()
export class TgaSchedulerService {
  private readonly logger = new Logger(TgaSchedulerService.name);

  constructor(private readonly tgaSyncService: TgaSyncService) {}

  @Cron('0 16 * * *') // 4:00 PM UTC = 2:00 AM AEST
  async runNightlySync(): Promise<void> {
    this.logger.log('Nightly TGA sync starting...');
    try {
      const result = await this.tgaSyncService.syncAll('nightly_cron');
      this.logger.log(`Nightly sync complete: ${JSON.stringify(result)}`);
    } catch (error: any) {
      this.logger.error(`Nightly sync failed: ${error.message}`, error.stack);
    }
  }

  async triggerManualSync(userId: string): Promise<{ syncLogId: string }> {
    const running = await this.tgaSyncService.getRunningSync();
    if (running) {
      throw new Error('A sync is already running');
    }
    const syncLogId = await this.tgaSyncService.startSync(`manual:${userId}`);
    // Run in background — don't await
    this.tgaSyncService.syncAll(`manual:${userId}`, syncLogId).catch((err: any) => {
      this.logger.error(`Manual sync failed: ${err.message}`, err.stack);
    });
    return { syncLogId };
  }
}
