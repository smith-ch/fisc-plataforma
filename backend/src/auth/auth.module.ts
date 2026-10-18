import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, User } from '../entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAttempts } from './login-attempts';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order])],
  controllers: [AuthController],
  providers: [AuthService, LoginAttempts],
  exports: [AuthService],
})
export class AuthModule {}
