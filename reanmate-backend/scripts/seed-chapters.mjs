import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

const here = dirname(fileURLToPath(import.meta.url));
const chaptersPath = resolve(here, 'data/chapters.json');
const chapters = JSON.parse(await readFile(chaptersPath, 'utf8'));

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || 'reanmate');
  const collection = db.collection('chapters');
  await Promise.all([
    collection.createIndex({ id: 1 }, { unique: true }),
    collection.createIndex({ grade: 1, subject: 1, status: 1, sortOrder: 1 }),
  ]);
  const now = new Date();
  const writes = chapters.map((chapter) => ({
    updateOne: {
      filter: { id: chapter.id },
      update: {
        $set: { ...chapter, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    },
  }));
  const result = writes.length ? await collection.bulkWrite(writes) : null;
  console.log(
    `Seeded ${chapters.length} chapters. Matched ${result?.matchedCount ?? 0}, upserted ${result?.upsertedCount ?? 0}.`,
  );
} finally {
  await client.close();
}
