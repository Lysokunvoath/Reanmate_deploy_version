import type { Role } from './auth.constants.js';

/** Shape the frontend expects — mirrors `User` in frontend/lib/types.ts. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}

/** Better Auth session as we consume it. */
export interface AuthSession {
  user: AuthUser;
  sessionId: string;
}
