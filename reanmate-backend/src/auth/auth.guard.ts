import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AUTH_INSTANCE, type Role } from './auth.constants.js';
import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.decorators.js';
import type { AuthInstance } from './auth.provider.js';
import type { AuthUser } from './auth.types.js';

/**
 * Validates the Better Auth session cookie and enforces @Roles().
 *
 * Registered globally in AuthModule, so every route is protected by default
 * and must opt out with @Public() — the safer direction for NFR-SEC-04.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_INSTANCE) private readonly auth: AuthInstance,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const { fromNodeHeaders } = await import('better-auth/node');

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
      query: { disableRefresh: true },
    });

    if (!session?.user) {
      throw new UnauthorizedException('សូមចូលគណនីជាមុនសិន។');
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role === 'admin' ? 'admin' : 'student',
      displayName: session.user.name ?? '',
    };
    (request as Request & { user: AuthUser }).user = user;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('អ្នកមិនមានសិទ្ធិចូលទំព័រនេះទេ។');
    }

    return true;
  }
}
