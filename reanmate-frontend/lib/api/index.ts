/**
 * Data access layer.
 *
 * Every function mirrors an endpoint in docs/API-CONTRACT.md and calls the
 * NestJS + MongoDB backend. Authenticated calls send the session cookie.
 */

import type {
  ChatMessage,
  Chapter,
  ChapterProgress,
  GeneratedChapterContent,
  Grade,
  QuizAttempt,
  Subject,
  SubjectId,
} from "@/lib/types";

// The browser calls same-origin /api/* (proxied by next.config.ts rewrites) so
// the session cookie belongs to the frontend's domain; the Next.js server calls
// the backend directly.
const API_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "/api";

type AuthResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    role?: "student" | "admin";
  };
};

export const GRADES: Grade[] = [10, 11, 12];

export const SUBJECTS: Subject[] = [
  { id: "math", nameKm: "គណិតវិទ្យា" },
  { id: "history", nameKm: "ប្រវត្តិវិទ្យា" },
];

export function getSubject(id: SubjectId): Subject {
  return SUBJECTS.find((s) => s.id === id)!;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/sign-in/email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Origin: window.location.origin },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await getApiError(res));
  return (await res.json()) as AuthResponse;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/sign-up/email`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Origin: window.location.origin },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error(await getApiError(res));
  return (await res.json()) as AuthResponse;
}

async function getApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as {
      message?: string | string[];
      error?: { message?: string };
    };
    if (Array.isArray(body.message)) return body.message.join(" ");
    return body.message ?? body.error?.message ?? "សូមពិនិត្យព័ត៌មានរបស់អ្នក ហើយព្យាយាមម្តងទៀត។";
  } catch {
    return "សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត។";
  }
}

/** GET /chapters?grade=&subject= — students only ever see approved chapters */
export async function getApprovedChapters(grade: Grade, subject: SubjectId): Promise<Chapter[]> {
  try {
    const params = new URLSearchParams({ grade: String(grade), subject });
    const res = await fetch(`${API_URL}/chapters?${params}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Chapter[];
  } catch {
    return [];
  }
}

/** GET /chapters/:id */
export async function getChapter(id: string): Promise<Chapter | undefined> {
  try {
    const res = await fetch(`${API_URL}/chapters/${id}`, { cache: "no-store" });
    if (!res.ok) return undefined;
    return (await res.json()) as Chapter;
  } catch {
    return undefined;
  }
}

/** Next approved chapter in the same grade+subject, for the quiz success banner */
export async function getNextChapter(current: Chapter): Promise<Chapter | undefined> {
  const approved = await getApprovedChapters(current.grade, current.subject);
  return approved.find((c) => c.sortOrder > current.sortOrder);
}

/** Error from an authenticated call; `status` lets pages handle 401/403. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError("សូមពិនិត្យការតភ្ជាប់ ហើយព្យាយាមម្តងទៀត។", 0);
  }
  if (!res.ok) throw new ApiError(await getApiError(res), res.status);
  return (await res.json()) as T;
}

/** GET /admin/chapters — admin sees drafts too */
export function getAllChapters(): Promise<Chapter[]> {
  return authedFetch<Chapter[]>("/admin/chapters");
}

/** GET /admin/chapters/:id — includes drafts and sourceText */
export function getAdminChapter(id: string): Promise<Chapter> {
  return authedFetch<Chapter>(`/admin/chapters/${encodeURIComponent(id)}`);
}

export type ChapterInput = Omit<Chapter, "id" | "questions"> & {
  questions: GeneratedChapterContent["questions"];
};

/** POST /admin/chapters */
export function createChapter(input: Partial<ChapterInput>): Promise<Chapter> {
  return authedFetch<Chapter>("/admin/chapters", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** PATCH /admin/chapters/:id */
export function updateChapter(id: string, patch: Partial<ChapterInput>): Promise<Chapter> {
  return authedFetch<Chapter>(`/admin/chapters/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

/** GET /chapters/:id/messages — this user's saved chat with ReanMate */
export function getChatMessages(chapterId: string): Promise<ChatMessage[]> {
  return authedFetch<ChatMessage[]>(`/chapters/${encodeURIComponent(chapterId)}/messages`);
}

/** POST /chapters/:id/quiz/attempts — the backend scores the answers and updates progress. */
export function submitQuizAttempt(
  chapterId: string,
  answers: Record<string, number>,
): Promise<QuizAttempt & { chapterCompleted: boolean }> {
  return authedFetch(`/chapters/${encodeURIComponent(chapterId)}/quiz/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}

/** GET /me/progress — best score + completion per chapter for this user */
export function getMyProgress(): Promise<ChapterProgress[]> {
  return authedFetch<ChapterProgress[]>("/me/progress");
}

/** POST /chapters/:id/messages — asks Gemini about the chapter, including its video. */
export async function sendChatMessage(
  chapterId: string,
  content: string,
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const res = await fetch(`${API_URL}/chapters/${encodeURIComponent(chapterId)}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Unable to send chat message.");
  return (await res.json()) as { userMessage: ChatMessage; assistantMessage: ChatMessage };
}

/** POST /tts — MP3 audio of the text (Khmer voice via Gemini TTS on the backend). */
export async function synthesizeSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/tts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Unable to synthesize speech.");
  return res.blob();
}

/** POST /admin/chapters/:id/generate — Gemini summary + MCQs from the stored sourceText. */
export function generateChapterContent(chapterId: string): Promise<GeneratedChapterContent> {
  return authedFetch<GeneratedChapterContent>(
    `/admin/chapters/${encodeURIComponent(chapterId)}/generate`,
    { method: "POST", body: "{}" },
  );
}
