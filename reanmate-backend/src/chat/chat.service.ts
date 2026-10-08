import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import { DatabaseService } from '../database/database.service.js';
import { ChaptersService } from '../chapters/chapters.service.js';
import type { Chapter } from '../chapters/chapter.types.js';
import { GeminiService, type ChatTurn } from './gemini.service.js';
import type { ChatMessage, ChatRole } from './chat.types.js';

interface ChatMessageDocument {
  id: string;
  userId: string;
  chapterId: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

// Conversation turns sent to Gemini for context; keeps prompts bounded.
const HISTORY_LIMIT = 20;
// Textbook source text can be long; cap what goes into the system prompt.
const MAX_SOURCE_CHARS = 12000;

@Injectable()
export class ChatService {
  constructor(
    private readonly database: DatabaseService,
    private readonly chapters: ChaptersService,
    private readonly gemini: GeminiService,
  ) {}

  private get collection(): Collection<ChatMessageDocument> {
    return this.database.db.collection<ChatMessageDocument>('chatmessages');
  }

  async ensureIndexes(): Promise<void> {
    await this.collection.createIndex({ userId: 1, chapterId: 1, createdAt: 1 });
  }

  async listMessages(userId: string, chapterId: string): Promise<ChatMessage[]> {
    await this.ensureIndexes();
    await this.requireChapter(chapterId);
    const docs = await this.collection
      .find({ userId, chapterId }, { projection: { _id: 0 } })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map(toChatMessage);
  }

  async sendMessage(
    userId: string,
    chapterId: string,
    content: string,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    await this.ensureIndexes();
    const chapter = await this.requireChapter(chapterId);

    const history = await this.collection
      .find({ userId, chapterId }, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .toArray();
    history.reverse();

    const userDoc: ChatMessageDocument = {
      id: randomUUID(),
      userId,
      chapterId,
      role: 'user',
      content,
      createdAt: new Date(),
    };
    await this.collection.insertOne(userDoc);

    const conversation: ChatTurn[] = [...history, userDoc].map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      text: message.content,
    }));

    let replyText: string;
    try {
      replyText = await this.gemini.generateReply(
        buildSystemInstruction(chapter),
        conversation,
        getGeminiVideoUri(chapter.moeysEmbedUrl),
      );
    } catch (error) {
      console.error('[Chat] Gemini request failed:', error);
      throw new BadGatewayException('ReanMate មិនអាចឆ្លើយបានទេពេលនេះ សូមសាកល្បងម្តងទៀត។');
    }

    const assistantDoc: ChatMessageDocument = {
      id: randomUUID(),
      userId,
      chapterId,
      role: 'assistant',
      content: replyText,
      createdAt: new Date(),
    };
    await this.collection.insertOne(assistantDoc);

    return { userMessage: toChatMessage(userDoc), assistantMessage: toChatMessage(assistantDoc) };
  }

  private async requireChapter(chapterId: string): Promise<Chapter> {
    const chapter = await this.chapters.findById(chapterId);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    return chapter;
  }
}

function toChatMessage(doc: ChatMessageDocument): ChatMessage {
  return {
    id: doc.id,
    chapterId: doc.chapterId,
    role: doc.role,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
  };
}

function buildSystemInstruction(chapter: Chapter): string {
  const source = chapter.sourceText.slice(0, MAX_SOURCE_CHARS);
  return [
    'អ្នកគឺជា ReanMate (មិត្ត AI) — មិត្តភក្តិដែលជួយសិស្សរៀន មិនមែនជាគ្រូបង្រៀនទេ។',
    'ឆ្លើយជាភាសាខ្មែរជានិច្ច ដោយសាមញ្ញ ស្និទ្ធស្នាល និងលើកទឹកចិត្ត។',
    `មេរៀនបច្ចុប្បន្ន៖ "${chapter.title}"`,
    `សេចក្តីសង្ខេបមេរៀន៖\n${chapter.summary}`,
    `ខ្លឹមសារពេញលេញនៃមេរៀន (សម្រាប់យោង)៖\n${source}`,
    'ត្រូវផ្អែកចម្លើយរបស់អ្នកលើខ្លឹមសារខាងលើ។ បើសំណួរនោះមិនមានចម្លើយក្នុងខ្លឹមសារនេះទេ សូមប្រាប់ត្រង់ៗថាអ្នកមិនដឹង ជាជាងបង្កើតចម្លើយមិនពិត។',
  ].join('\n\n');
}

function getGeminiVideoUri(embedUrl: string): string | undefined {
  if (!embedUrl) return undefined;

  try {
    const url = new URL(embedUrl);
    if (url.protocol !== 'https:') return undefined;

    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
      const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
    }

    if (url.hostname === 'youtu.be') {
      const videoId = url.pathname.slice(1).split('/')[0];
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}
