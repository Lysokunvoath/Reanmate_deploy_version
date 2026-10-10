export type Grade = 10 | 11 | 12;

export type SubjectId = 'math' | 'history';

export type ChapterStatus = 'draft' | 'approved';

export interface Question {
  id: string;
  chapterId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sortOrder: number;
}

export interface Chapter {
  id: string;
  grade: Grade;
  subject: SubjectId;
  title: string;
  sortOrder: number;
  summary: string;
  sourceText: string;
  moeysEmbedUrl: string;
  moeysCredit: string;
  status: ChapterStatus;
  questions: Question[];
  /** Gemini's text notes on the video at `videoNotesSource`; see video-notes.ts. */
  videoNotes?: string;
  videoNotesSource?: string;
}

export type QuestionInput = Pick<Question, 'prompt' | 'options' | 'correctIndex' | 'explanation'>;

export type ChapterInput = Omit<Chapter, 'id' | 'questions'> & { questions?: QuestionInput[] };

/** Payload returned by POST /admin/chapters/:id/generate */
export interface GeneratedChapterContent {
  summary: string;
  questions: QuestionInput[];
}
