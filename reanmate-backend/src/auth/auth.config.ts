import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { memoryAdapter, type MemoryDB } from '@better-auth/memory-adapter';
import type { DatabaseService } from '../database/database.service.js';
import { AUTH_BASE_PATH } from './auth.constants.js';
import { sendOTPEmail } from './email.service.js';

export function createAuth(database?: DatabaseService, memoryDb?: MemoryDB) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
  }
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    appName: 'ReanMate',
    database: database
      ? mongodbAdapter(database.db, {
          client: database.client,
          transaction: process.env.MONGODB_TRANSACTIONS !== 'false',
        })
      : memoryAdapter(memoryDb ?? {}),
    basePath: AUTH_BASE_PATH,
    secret,
    // Browser-facing origin: Next.js proxies /auth to NestJS.
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    trustedOrigins: [process.env.CORS_ORIGIN ?? 'http://localhost:3000'],
    socialProviders: googleClientId && googleClientSecret ? {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    } : undefined,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      // Better Auth hashes passwords with salted scrypt.
    },
    user: {
      additionalFields: {
        role: { type: ['student', 'admin'], defaultValue: 'student', input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const fallbackName = user.email.split('@')[0] || user.email;
            const name = user.name.trim() || fallbackName.slice(0, 100);
            if (!name || name.length > 100 || user.email.length > 254) {
              throw new APIError('BAD_REQUEST', { message: 'Invalid name or email length.' });
            }
            return { data: { ...user, name, role: 'student' } };
          },
        },
      },
    },
    plugins: [
      emailOTP({
        expiresIn: 60 * 5,
        otpLength: 6,
        allowedAttempts: 3,
        disableSignUp: true,
        sendVerificationOTP: sendOTPEmail,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 10 },
        '/sign-up/email': { window: 60, max: 5 },
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ['x-forwarded-for'] },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
