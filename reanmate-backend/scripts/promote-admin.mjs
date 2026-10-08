import { MongoClient } from 'mongodb';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  throw new Error('Usage: npm run admin:promote -- registered-user@example.com');
}
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const result = await client.db(process.env.MONGODB_DB_NAME || 'reanmate')
    .collection('user').updateOne({ email }, { $set: { role: 'admin', updatedAt: new Date() } });
  if (!result.matchedCount) throw new Error('No registered account with that email. Sign up in ReanMate first.');
  console.log(`Admin access granted to ${email}.`);
} finally {
  await client.close();
}
