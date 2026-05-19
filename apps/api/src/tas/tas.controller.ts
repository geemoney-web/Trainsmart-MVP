import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { TasService } from './tas.service';
import { CreateTasDto } from './dto/create-tas.dto';
import { PresignTasDto } from './dto/presign-tas.dto';

@Controller('tas')
export class TasController {
  private readonly logger = new Logger(TasController.name);

  constructor(private readonly tasService: TasService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  async presign(@Body() dto: PresignTasDto) {
    try {
      return await this.tasService.generatePresignedUrl(dto);
    } catch (err: any) {
      this.logger.error(`Presign failed: ${err.message}`, err.stack);
      if (err.status) throw err;
      throw new InternalServerErrorException(err.message ?? 'Presign failed');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTas(@Body() dto: CreateTasDto) {
    try {
      return await this.tasService.create(dto);
    } catch (err: any) {
      this.logger.error(`TAS create failed: ${err.message}`, err.stack);
      if (err.status) throw err;
      throw new InternalServerErrorException(err.message ?? 'TAS create failed');
    }
  }

  @Get('rtos/:rtoId')
  async getTasByRto(@Param('rtoId') rtoId: string) {
    try {
      return await this.tasService.findByRto(rtoId);
    } catch (err: any) {
      this.logger.error(`TAS list failed: ${err.message}`, err.stack);
      if (err.status) throw err;
      throw new InternalServerErrorException(err.message ?? 'TAS list failed');
    }
  }
}
