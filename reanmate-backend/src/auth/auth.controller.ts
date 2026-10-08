import { Controller, Get, Header } from '@nestjs/common';
import { CurrentUser } from './auth.decorators.js';
import type { AuthUser } from './auth.types.js';

/**
 * Better Auth serves /auth/sign-up/email, /auth/sign-in/email and
 * /auth/sign-out itself (mounted as middleware in main.ts).
 *
 * This controller adds only GET /auth/me, which returns the user in the exact
 * shape frontend/lib/types.ts expects.
 */
@Controller('auth')
export class AuthController {
  /** GET /auth/me — API-CONTRACT §1 */
  @Get('me')
  @Header('Cache-Control', 'private, no-store')
  me(@CurrentUser() user: AuthUser): { user: AuthUser } {
    return { user };
  }
}
