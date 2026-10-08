import type { GoogleGenAIOptions } from '@google/genai';

/**
 * Credentials for the Vertex AI clients. Hosts without a filesystem key (e.g.
 * Vercel) pass the service-account JSON base64-encoded in
 * GOOGLE_SERVICE_ACCOUNT_KEY_BASE64. When it is unset, the client falls back to
 * Application Default Credentials: GOOGLE_APPLICATION_CREDENTIALS (key file) or
 * `gcloud auth application-default login`.
 */
export function vertexAuthOptions(): Pick<GoogleGenAIOptions, 'googleAuthOptions'> {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64?.trim();
  if (!encoded) return {};
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is not base64-encoded service-account JSON.');
  }
  return { googleAuthOptions: { credentials } };
}
