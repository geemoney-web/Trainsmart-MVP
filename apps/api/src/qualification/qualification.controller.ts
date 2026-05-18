import {
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { QualificationService } from './qualification.service';

@Controller('qualifications')
export class QualificationController {
  private readonly logger = new Logger(QualificationController.name);

  constructor(private readonly qualificationService: QualificationService) {}

  @Get(':qualId')
  async getQualificationDetail(@Param('qualId') qualId: string) {
    try {
      return await this.qualificationService.findOne(qualId);
    } catch (err: any) {
      this.logger.error(
        `Failed to get qualification ${qualId}: ${err.message}`,
        err.stack,
      );
      if (err.status) throw err; // rethrow NestJS HttpExceptions (404 etc) as-is
      throw new InternalServerErrorException(
        err.message ?? 'Failed to retrieve qualification',
      );
    }
  }
}
