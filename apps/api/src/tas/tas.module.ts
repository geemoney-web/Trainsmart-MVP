import { Module } from '@nestjs/common';
import { TasController } from './tas.controller';
import { TasService } from './tas.service';

@Module({
  controllers: [TasController],
  providers: [TasService],
})
export class TasModule {}
