import { Module } from '@nestjs/common';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';
import { TgaModule } from '../tga/tga.module';

@Module({
  imports: [TgaModule],
  controllers: [UnitController],
  providers: [UnitService],
})
export class UnitModule {}
