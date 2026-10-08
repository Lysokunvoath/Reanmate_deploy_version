import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AUTH_INSTANCE } from './auth.constants.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { authProvider } from './auth.provider.js';
import { DatabaseService } from '../database/database.service.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [DatabaseService, authProvider, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [AUTH_INSTANCE, DatabaseService],
})
export class AuthModule {}
