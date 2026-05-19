import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { RtoModule } from './rto/rto.module';
import { UsersModule } from './users/users.module';
import { TgaModule } from './tga/tga.module';
import { QualificationModule } from './qualification/qualification.module';
import { UnitModule } from './unit/unit.module';
import { TasModule } from './tas/tas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    RtoModule,
    UsersModule,
    TgaModule,
    QualificationModule,
    UnitModule,
    TasModule,
  ],
})
export class AppModule {}
