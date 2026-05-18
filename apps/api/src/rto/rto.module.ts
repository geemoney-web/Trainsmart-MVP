import { Module } from '@nestjs/common';
import { RtoController } from './rto.controller';
import { RtoService } from './rto.service';

@Module({
  controllers: [RtoController],
  providers: [RtoService],
})
export class RtoModule {}
