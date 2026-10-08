/** DI token for the Better Auth instance (created asynchronously — the library is ESM-only). */
export const AUTH_INSTANCE = 'AUTH_INSTANCE';

/** Base path the Better Auth handler is mounted on. Must match betterAuth({ basePath }). */
export const AUTH_BASE_PATH = '/auth';

/** The only two roles this app has — FR-AUTH-04. */
export const ROLES = ['student', 'admin'] as const;
export type Role = (typeof ROLES)[number];
