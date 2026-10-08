import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import { DatabaseService } from '../database/database.service.js';
import { ChaptersService } from '../chapters/chapters.service.js';
import type { ChapterProgress, QuizAttempt } from './quiz.types.js';

// FR-QUIZ-07: an attempt at or above this score completes the chapter.
const PASS_PERCENT = 70;

interface QuizAttemptDocument {
  id: string;
  userId: string;
  chapterId: string;
  score: number;
  total: number;
  answers: Record<string, number>;
  createdAt: Date;
}

interface ProgressDocument {
  userId: string;
  chapterId: string;
  bestScorePercent: number;
  completedAt: Date | null;
  updatedAt: Date;
}

@Injectable()
export class QuizService {
  constructor(
    private readonly database: DatabaseService,
    private readonly chapters: ChaptersService,
  ) {}

  private get attempts(): Collection<QuizAttemptDocument> {
    return this.database.db.collection<QuizAttemptDocument>('quizattempts');
  }

  private get progress(): Collection<ProgressDocument> {
    return this.database.db.collection<ProgressDocument>('progress');
  }

  async ensureIndexes(): Promise<void> {
    await Promise.all([
      this.attempts.createIndex({ userId: 1, chapterId: 1, createdAt: -1 }),
      this.progress.createIndex({ userId: 1, chapterId: 1 }, { unique: true }),
    ]);
  }

  /** Scores the attempt against the stored answer key — the client's score is never trusted. */
  async submitAttempt(
    userId: string,
    chapterId: string,
    answers: Record<string, number>,
  ): Promise<QuizAttempt & { chapterCompleted: boolean }> {
    await this.ensureIndexes();
    const chapter = await this.chapters.findById(chapterId);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    if (chapter.questions.length === 0) throw new BadRequestException('This chapter has no quiz.');

    const cleanAnswers: Record<string, number> = {};
    for (const question of chapter.questions) {
      const answer = answers[question.id];
      if (Number.isInteger(answer)) cleanAnswers[question.id] = answer;
    }
    const score = chapter.questions.filter((q) => cleanAnswers[q.id] === q.correctIndex).length;
    const total = chapter.questions.length;
    const percent = Math.round((score / total) * 100);
    const now = new Date();

    const attempt: QuizAttemptDocument = {
      id: randomUUID(),
      userId,
      chapterId,
      score,
      total,
      answers: cleanAnswers,
      createdAt: now,
    };
    await this.attempts.insertOne(attempt);

    // Keep the best score; completedAt is set by the first passing attempt only (FR-QUIZ-08).
    await this.progress.updateOne(
      { userId, chapterId },
      {
        $max: { bestScorePercent: percent },
        $set: { updatedAt: now },
        $setOnInsert: { completedAt: null },
      },
      { upsert: true },
    );
    if (percent >= PASS_PERCENT) {
      await this.progress.updateOne({ userId, chapterId, completedAt: null }, { $set: { completedAt: now } });
    }
    const saved = await this.progress.findOne({ userId, chapterId });

    return {
      id: attempt.id,
      chapterId,
      score,
      total,
      answers: cleanAnswers,
      createdAt: now.toISOString(),
      chapterCompleted: Boolean(saved?.completedAt),
    };
  }

  async listProgress(userId: string): Promise<ChapterProgress[]> {
    await this.ensureIndexes();
    const docs = await this.progress.find({ userId }).toArray();
    return docs.map((doc) => ({
      chapterId: doc.chapterId,
      bestScorePercent: doc.bestScorePercent,
      completedAt: doc.completedAt ? doc.completedAt.toISOString() : null,
    }));
  }
}
