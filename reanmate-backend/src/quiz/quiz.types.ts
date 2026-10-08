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
