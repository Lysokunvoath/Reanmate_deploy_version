import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import { DatabaseService } from '../database/database.service.js';
import { GeminiService } from '../chat/gemini.service.js';
import { getGeminiVideoUri, writeVideoNotes } from './video-notes.js';
import type {
  Chapter,
  ChapterInput,
  GeneratedChapterContent,
  Grade,
  Question,
  QuestionInput,
  SubjectId,
} from './chapter.types.js';

type ChapterDocument = Chapter & { _id?: unknown; createdAt?: Date; updatedAt?: Date };

// Textbook source text can be long; cap what goes into the generation prompt.
const MAX_SOURCE_CHARS = 30000;

const GENERATED_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 10,
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
          explanation: { type: 'string' },
        },
        required: ['prompt', 'options', 'correctIndex', 'explanation'],
      },
    },
  },
  required: ['summary', 'questions'],
};

@Injectable()
export class ChaptersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly gemini: GeminiService,
  ) {}

  // Chapter videos whose notes are being written, so simultaneous chats start one Gemini call.
  private readonly pendingVideoNotes = new Set<string>();

  private get collection(): Collection<ChapterDocument> {
    return this.database.db.collection<ChapterDocument>('chapters');
  }

  async ensureIndexes(): Promise<void> {
    await Promise.all([
      this.collection.createIndex({ id: 1 }, { unique: true }),
      this.collection.createIndex({ grade: 1, subject: 1, status: 1, sortOrder: 1 }),
    ]);
  }

  async findApproved(grade: Grade, subject: SubjectId): Promise<Chapter[]> {
    await this.ensureIndexes();
    const chapters = await this.collection
      .find({ grade, subject, status: 'approved' }, { projection: { _id: 0, sourceText: 0, videoNotes: 0, videoNotesSource: 0, createdAt: 0, updatedAt: 0 } })
      .sort({ sortOrder: 1 })
      .toArray();
    return chapters.map((chapter) => ({ ...chapter, sourceText: '' }));
  }

  async findById(id: string, includeDrafts = false): Promise<Chapter | null> {
    await this.ensureIndexes();
    const query = includeDrafts ? { id } : { id, status: 'approved' as const };
    const chapter = await this.collection.findOne(query, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } });
    return chapter ?? null;
  }

  async findAllForAdmin(): Promise<Chapter[]> {
    await this.ensureIndexes();
    return this.collection
      .find({}, { projection: { _id: 0, createdAt: 0, updatedAt: 0 } })
      .sort({ grade: 1, subject: 1, sortOrder: 1 })
      .toArray();
  }

  async create(input: ChapterInput): Promise<Chapter> {
    await this.ensureIndexes();
    const id = `g${input.grade}-${input.subject}-${randomUUID().slice(0, 8)}`;
    const { questions, ...fields } = input;
    const chapter: Chapter = { ...fields, id, questions: toQuestions(id, questions ?? []) };
    const now = new Date();
    await this.collection.insertOne({ ...chapter, createdAt: now, updatedAt: now });
    return chapter;
  }

  async update(id: string, patch: Partial<ChapterInput>): Promise<Chapter | null> {
    await this.ensureIndexes();
    const { questions, ...fields } = patch;
    const set: Partial<ChapterDocument> = { ...fields, updatedAt: new Date() };
    if (questions) set.questions = toQuestions(id, questions);
    await this.collection.updateOne({ id }, { $set: set });
    return this.findById(id, true);
  }

  /**
   * Stored text notes on the chapter's video, or '' when there is no video or
   * they aren't written yet. Missing or stale notes (the video URL changed)
   * are written in the background, so chat never waits the minutes this takes.
   */
  getVideoNotes(chapter: Chapter): string {
    const videoUri = getGeminiVideoUri(chapter.moeysEmbedUrl);
    if (!videoUri) return '';
    if (chapter.videoNotes && chapter.videoNotesSource === videoUri) return chapter.videoNotes;

    const key = `${chapter.id} ${videoUri}`;
    if (!this.pendingVideoNotes.has(key)) {
      this.pendingVideoNotes.add(key);
      writeVideoNotes(this.gemini, videoUri)
        .then((videoNotes) =>
          this.collection.updateOne({ id: chapter.id }, { $set: { videoNotes, videoNotesSource: videoUri } }),
        )
        .catch((error) => console.error(`[Chapters] Video notes for ${chapter.id} failed:`, error))
        .finally(() => this.pendingVideoNotes.delete(key));
    }
    return '';
  }

  /** Asks Gemini for a Khmer summary + MCQs grounded in the chapter's stored sourceText. */
  async generateContent(chapter: Chapter): Promise<GeneratedChapterContent> {
    const subjectKm = chapter.subject === 'math' ? 'គណិតវិទ្យា' : 'ប្រវត្តិវិទ្យា';
    const systemInstruction = [
      'អ្នកជាអ្នកជំនាញរៀបចំមេរៀនសម្រាប់សិស្សវិទ្យាល័យនៅកម្ពុជា។',
      'សរសេរជាភាសាខ្មែរទាំងអស់។ ប្រើតែខ្លឹមសារពីអត្ថបទប្រភពដែលបានផ្តល់ — កុំបង្កើតព័ត៌មានថ្មី។',
      'summary៖ សង្ខេបមេរៀនខ្លីៗ មានប្រយោគណែនាំមួយ រួចចំណុចសំខាន់ៗជាបញ្ជី (ចាប់ផ្តើមដោយ «• »)។',
      'questions៖ សំណួរពហុជ្រើសរើស ៥ ទៅ ១០ ដែលនីមួយៗមានជម្រើស ៤ ចម្លើយត្រឹមត្រូវតែមួយ (correctIndex ចាប់ពី 0) និងការពន្យល់ខ្លីថាហេតុអ្វីចម្លើយនោះត្រឹមត្រូវ។ លាយទីតាំងចម្លើយត្រឹមត្រូវ។',
    ].join('\n');
    const prompt = [
      `ថ្នាក់ទី${chapter.grade} · ${subjectKm} · មេរៀន៖ "${chapter.title}"`,
      `អត្ថបទប្រភព៖\n${chapter.sourceText.slice(0, MAX_SOURCE_CHARS)}`,
    ].join('\n\n');

    const generated = await this.gemini.generateJson<GeneratedChapterContent>(
      systemInstruction,
      prompt,
      GENERATED_SCHEMA,
    );
    const questions = (generated.questions ?? []).filter(
      (q) =>
        q.prompt?.trim()
        && Array.isArray(q.options)
        && q.options.length === 4
        && Number.isInteger(q.correctIndex)
        && q.correctIndex >= 0
        && q.correctIndex < 4,
    );
    if (!generated.summary?.trim() || questions.length === 0) {
      throw new Error('Gemini returned incomplete chapter content.');
    }
    return { summary: generated.summary.trim(), questions };
  }
}

function toQuestions(chapterId: string, questions: QuestionInput[]): Question[] {
  return questions.map((q, index) => ({
    id: `${chapterId}-q${index + 1}`,
    chapterId,
    prompt: q.prompt,
    options: [...q.options],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
    sortOrder: index + 1,
  }));
}
