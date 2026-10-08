import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from './auth.constants.js';
import type { AuthUser } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Opt a route out of authentication (login, signup, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restrict a route to specific roles — FR-AUTH-05. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Inject the authenticated user into a handler argument. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user as AuthUser;
  },
);
