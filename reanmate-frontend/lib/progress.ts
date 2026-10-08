/**
 * Student progress. Quiz scores and completion come from the backend
 * (GET /me/progress); only the "continue where you left off" shortcut stays in
 * localStorage, since it is a per-device convenience.
 */

import { getMyProgress, submitQuizAttempt } from "@/lib/api";
import type { ChapterProgress } from "@/lib/types";

const LAST_CHAPTER_KEY = "reanmate:last-chapter";
const LEGACY_LAST_CHAPTER_KEY = "ai-tutor:last-chapter";

export type ProgressMap = Record<string, ChapterProgress>;

// One request per page load is shared by every chapter card; cleared after a quiz.
let progressCache: Promise<ProgressMap> | null = null;

/** Progress for the signed-in student; empty when signed out or offline. */
export function loadProgress(): Promise<ProgressMap> {
  if (!progressCache) {
    progressCache = getMyProgress()
      .then((list) => Object.fromEntries(list.map((item) => [item.chapterId, item])))
      .catch(() => {
        progressCache = null;
        return {};
      });
  }
  return progressCache;
}

/** Saves a finished quiz; resolves to whether the chapter is now completed. */
export async function recordQuizResult(
  chapterId: string,
  answers: Record<string, number>,
): Promise<boolean> {
  const result = await submitQuizAttempt(chapterId, answers);
  progressCache = null;
  return result.chapterCompleted;
}

export interface LastVisited {
  chapterId: string;
  grade: number;
  subject: string;
  title: string;
}

export function setLastVisited(visit: LastVisited): void {
  try {
    localStorage.setItem(LAST_CHAPTER_KEY, JSON.stringify(visit));
  } catch {
    // Storage blocked (private mode): the continue card just won't show.
  }
}

export function getLastVisited(): LastVisited | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(LAST_CHAPTER_KEY) ?? localStorage.getItem(LEGACY_LAST_CHAPTER_KEY);
    return raw ? (JSON.parse(raw) as LastVisited) : null;
  } catch {
    return null;
  }
}
