import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import express, { type NextFunction, type Request, type Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module.js';
import { AUTH_BASE_PATH, AUTH_INSTANCE } from './auth/auth.constants.js';
import type { AuthInstance } from './auth/auth.config.js';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true });
  const server = app.getHttpAdapter().getInstance();
  // Only the local Next.js proxy is trusted by default. Configure the exact
  // proxy subnet when deploying the API behind a remote reverse proxy.
  server.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback');
  const handler = toNodeHandler(app.get<AuthInstance>(AUTH_INSTANCE));
  server.all(`${AUTH_BASE_PATH}/*splat`, (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, no-store');
    // Leave /auth/me for the guarded Nest controller.
    if (req.path.replace(/\/$/, '') === `${AUTH_BASE_PATH}/me`) return next();
    if (
      req.path.replace(/\/$/, '') === `${AUTH_BASE_PATH}/sign-in/email-otp`
      || req.path.replace(/\/$/, '') === `${AUTH_BASE_PATH}/email-otp/send-verification-otp`
    ) {
      return res.status(404).json({
        code: 'OTP_SIGN_IN_DISABLED',
        message: 'Email code sign-in is disabled. Use email and password.',
      });
    }
    req.headers['x-forwarded-for'] = req.ip ?? req.socket.remoteAddress ?? '';
    return handler(req, res);
  });
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  return app;
}
