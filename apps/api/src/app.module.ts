import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { RtoModule } from './rto/rto.module';
import { UsersModule } from './users/users.module';
import { TgaModule } from './tga/tga.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    RtoModule,
    UsersModule,
    TgaModule,
  ],
})
export class AppModule {}
