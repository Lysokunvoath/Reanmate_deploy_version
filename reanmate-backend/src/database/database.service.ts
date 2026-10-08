import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { MongoClient, type Db } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private clientInstance?: MongoClient;
  private database?: Db;

  get client(): MongoClient {
    if (!this.clientInstance) throw new Error('Database is not connected.');
    return this.clientInstance;
  }

  get db(): Db {
    if (!this.database) throw new Error('Database is not connected.');
    return this.database;
  }

  async connect(): Promise<void> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is required. See .env.example.');
    this.clientInstance = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
    try {
      await this.client.connect();
      this.database = this.client.db(process.env.MONGODB_DB_NAME || 'reanmate');
      // Enforce uniqueness for concurrent registrations and expire stale data.
      await Promise.all([
        this.db.collection('user').createIndex({ email: 1 }, { unique: true }),
        this.db.collection('session').createIndex({ token: 1 }, { unique: true }),
        this.db.collection('session').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        this.db.collection('session').createIndex({ userId: 1 }),
        this.db.collection('account').createIndex({ providerId: 1, accountId: 1 }, { unique: true }),
        this.db.collection('account').createIndex({ userId: 1 }),
        this.db.collection('verification').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
    } catch {
      await this.client.close();
      throw new Error('Cannot connect to MongoDB. Check MONGODB_URI, database permissions, and Atlas network access.');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.clientInstance?.close();
  }
}
