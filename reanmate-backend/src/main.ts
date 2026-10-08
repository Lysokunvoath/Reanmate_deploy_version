import { createApp } from './create-app.js';
import { VersionService } from './version/version.service.js';

const app = await createApp();
const port = Number(process.env.PORT ?? 4000);
await app.listen(port, process.env.HOST ?? '127.0.0.1');
const version = app.get(VersionService).getVersion();
console.log(`ReanMate API → http://localhost:${port} (${version.commit.shortHash ?? 'unversioned'})`);
