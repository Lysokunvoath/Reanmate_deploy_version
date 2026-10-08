import type { FactoryProvider } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AUTH_INSTANCE } from './auth.constants.js';
import { createAuth, type AuthInstance } from './auth.config.js';

export const authProvider: FactoryProvider<AuthInstance> = {
  provide: AUTH_INSTANCE,
  inject: [DatabaseService],
  useFactory: async (database: DatabaseService) => {
    if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
      throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.');
    }
    try {
      await database.connect();
      return createAuth(database);
    } catch (error) {
      if (process.env.AUTH_MEMORY_FALLBACK !== 'true') throw error;
      console.warn(
        '[Auth] MongoDB unavailable; using temporary in-memory auth storage for local development.',
      );
      return createAuth(undefined, {
        user: [],
        session: [],
        account: [],
        verification: [],
        rateLimit: [],
      });
    }
  },
};

export type { AuthInstance } from './auth.config.js';
