// Vercel serverless entry: reuses one Nest app per warm instance and hands
// each request to its Express server. `npm run build` compiles src/ to dist/.
import { createApp } from '../dist/create-app.js';

let serverPromise;

async function createServer() {
  const app = await createApp();
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req, res) {
  serverPromise ??= createServer().catch((error) => {
    serverPromise = undefined;
    throw error;
  });
  const server = await serverPromise;
  return server(req, res);
}
