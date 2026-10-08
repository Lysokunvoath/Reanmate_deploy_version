/**
 * Shared API types — the contract for the Node.js + MongoDB backend.
 * See docs/API-CONTRACT.md. lib/api fetches these shapes from the backend.
 */

export type Grade = 10 | 11 | 12;

export type SubjectId = "math" | "history";

export interface Subject {
  id: SubjectId;
  /** Khmer display name, e.g. គណិតវិទ្យា */
  nameKm: string;
}

export type ChapterStatus = "draft" | "approved";

export interface Question {
  id: string;
  chapterId: string;
  /** Question text in Khmer */
  prompt: string;
  /** Answer options in Khmer */
  options: string[];
  /** Index into options */
  correctIndex: number;
  /** Why the correct answer is correct (Khmer) */
  explanation: string;
  sortOrder: number;
}

export interface Chapter {
  id: string;
  grade: Grade;
  subject: SubjectId;
  /** Chapter title in Khmer */
  title: string;
  sortOrder: number;
  /** Admin-approved lesson summary / key points (Khmer) */
  summary: string;
  /** Textbook-derived source text used for AI grounding (admin only) */
  sourceText: string;
  /** MoEYS video embed URL; empty string when not configured yet */
  moeysEmbedUrl: string;
  /** Attribution shown under the video */
  moeysCredit: string;
  status: ChapterStatus;
  questions: Question[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  chapterId: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO timestamp
}

export interface QuizAttempt {
  id: string;
  chapterId: string;
  score: number;
  total: number;
  /** Selected option index per question id */
  answers: Record<string, number>;
  createdAt: string;
}

export interface ChapterProgress {
  chapterId: string;
  bestScorePercent: number;
  completedAt: string | null;
}

/** Payload returned by the admin "generate" endpoint */
export interface GeneratedChapterContent {
  summary: string;
  questions: Array<Pick<Question, "prompt" | "options" | "correctIndex" | "explanation">>;
}
