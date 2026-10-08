import { BadGatewayException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Binary, type Collection } from 'mongodb';
import { DatabaseService } from '../database/database.service.js';
import { GeminiSpeechService } from './gemini-speech.service.js';

interface TtsCacheDocument {
  key: string;
  voice: string;
  audio: Binary;
  createdAt: Date;
}

interface TtsUsageDocument {
  userId: string;
  day: string;
  characters: number;
  expiresAt: Date;
}

// Gemini prebuilt voice; Kore is female. Gemini voices are multilingual.
const DEFAULT_VOICE = 'Kore';
// Cached clips expire so the free Atlas tier does not fill with one-off chat replies.
const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
// Gemini TTS bills per use; cap what each student can synthesize per UTC day.
const DEFAULT_DAILY_CHARACTER_LIMIT = 20000;

@Injectable()
export class TtsService {
  private indexesReady?: Promise<unknown>;

  constructor(
    private readonly database: DatabaseService,
    private readonly speech: GeminiSpeechService,
  ) {}

  private get cache(): Collection<TtsCacheDocument> {
    return this.database.db.collection<TtsCacheDocument>('ttscache');
  }

  private get usage(): Collection<TtsUsageDocument> {
    return this.database.db.collection<TtsUsageDocument>('ttsusage');
  }

  private ensureIndexes(): Promise<unknown> {
    this.indexesReady ??= Promise.all([
      this.cache.createIndex({ key: 1 }, { unique: true }),
      this.cache.createIndex({ createdAt: 1 }, { expireAfterSeconds: CACHE_TTL_SECONDS }),
      this.usage.createIndex({ userId: 1, day: 1 }, { unique: true }),
      this.usage.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).catch((error) => {
      this.indexesReady = undefined;
      throw error;
    });
    return this.indexesReady;
  }

  async synthesize(userId: string, text: string): Promise<Buffer> {
    await this.ensureIndexes();
    const isKhmer = /[ក-៿]/u.test(text);
    const voice = process.env.GEMINI_TTS_VOICE || DEFAULT_VOICE;
    const key = createHash('sha256').update(`${voice}\n${text}`).digest('hex');

    const cached = await this.cache.findOne({ key });
    if (cached) return Buffer.from(cached.audio.buffer);

    const day = await this.chargeUsage(userId, text.length);

    let audio: Buffer;
    try {
      audio = await this.speech.synthesize(text, voice, isKhmer);
    } catch (error) {
      console.error('[TTS] Gemini TTS request failed:', error);
      await this.usage.updateOne({ userId, day }, { $inc: { characters: -text.length } }).catch(() => {});
      throw new BadGatewayException('សំឡេងមិនអាចប្រើបានពេលនេះ សូមសាកល្បងម្តងទៀត។');
    }

    await this.cache
      .updateOne(
        { key },
        { $setOnInsert: { key, voice, audio: new Binary(audio), createdAt: new Date() } },
        { upsert: true },
      )
      .catch((error) => console.error('[TTS] Failed to cache audio:', error));
    return audio;
  }

  /** Adds to today's character count, or throws 429 past the limit. Returns the day charged. */
  private async chargeUsage(userId: string, characters: number): Promise<string> {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const expiresAt = new Date(`${day}T00:00:00.000Z`);
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 2);

    const record = await this.usage.findOneAndUpdate(
      { userId, day },
      { $inc: { characters }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: 'after' },
    );
    const limit = Number(process.env.TTS_DAILY_CHAR_LIMIT) || DEFAULT_DAILY_CHARACTER_LIMIT;
    if ((record?.characters ?? characters) > limit) {
      await this.usage.updateOne({ userId, day }, { $inc: { characters: -characters } });
      throw new HttpException('អ្នកបានប្រើសំឡេងអស់ចំនួនកំណត់សម្រាប់ថ្ងៃនេះហើយ។', HttpStatus.TOO_MANY_REQUESTS);
    }
    return day;
  }
}
