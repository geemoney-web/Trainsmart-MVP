import {
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UnitService } from './unit.service';

@Controller('units')
export class UnitController {
  private readonly logger = new Logger(UnitController.name);

  constructor(private readonly unitService: UnitService) {}

  @Get(':unitId')
  async getUnitDetail(@Param('unitId') unitId: string) {
    try {
      return await this.unitService.findOne(unitId);
    } catch (err: any) {
      this.logger.error(
        `Failed to get unit ${unitId}: ${err.message}`,
        err.stack,
      );
      if (err.status) throw err; // rethrow NestJS HttpExceptions (404 etc) as-is
      throw new InternalServerErrorException(
        err.message ?? 'Failed to retrieve unit',
      );
    }
  }
}
