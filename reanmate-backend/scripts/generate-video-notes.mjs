// Writes Gemini's video notes for every chapter whose notes are missing or
// stale, so no student waits on that during chat. Run after `npm run build`.
import 'reflect-metadata';
import { MongoClient } from 'mongodb';
import { GeminiService } from '../dist/chat/gemini.service.js';
import { getGeminiVideoUri, writeVideoNotes } from '../dist/chapters/video-notes.js';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
const gemini = new GeminiService();
let failed = 0;

try {
  await client.connect();
  const collection = client.db(process.env.MONGODB_DB_NAME || 'reanmate').collection('chapters');
  const chapters = await collection
    .find({}, { projection: { _id: 0, id: 1, moeysEmbedUrl: 1, videoNotes: 1, videoNotesSource: 1 } })
    .toArray();

  for (const chapter of chapters) {
    const videoUri = getGeminiVideoUri(chapter.moeysEmbedUrl);
    if (!videoUri || (chapter.videoNotes && chapter.videoNotesSource === videoUri)) continue;
    const started = Date.now();
    try {
      const videoNotes = await writeVideoNotes(gemini, videoUri);
      await collection.updateOne({ id: chapter.id }, { $set: { videoNotes, videoNotesSource: videoUri } });
      console.log(`${chapter.id}: ${videoNotes.length} chars in ${Math.round((Date.now() - started) / 1000)} s`);
    } catch (error) {
      failed += 1;
      console.error(`${chapter.id}: failed — ${error instanceof Error ? error.message : error}`);
    }
  }
} finally {
  await client.close();
}
process.exitCode = failed ? 1 : 0;
