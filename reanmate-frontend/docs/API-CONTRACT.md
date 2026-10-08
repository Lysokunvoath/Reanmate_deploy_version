# ReanMate — API Contract (Frontend ⇄ Node.js/MongoDB Backend)

This document defines the HTTP API the backend team should implement.
Every function in [`lib/api/index.ts`](../lib/api/index.ts) maps 1-to-1 to an endpoint here, and all
request/response shapes are defined in [`lib/types.ts`](../lib/types.ts).

**Integration rule:** when the backend is ready, only `lib/api/index.ts`
(and `lib/progress.ts` for persistence) should change — no page/component rewrites.

Base URL: `process.env.NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api`).

---

## Conventions

- JSON everywhere, UTF-8 (content is Khmer text).
- Auth: JWT in `Authorization: Bearer <token>` (backend's choice of session model is fine — align before implementing).
- Errors: `{ "error": { "code": string, "message": string } }` with proper HTTP status.
- IDs are strings (Mongo `_id` serialized). The mock uses readable ids like `g10-math-c1`; real ids can be ObjectIds.

## Roles

- `student` — default role at signup.
- `admin` — only role allowed on `/admin/*` endpoints.

---

## 1. Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/auth/signup` | `{ email, password, displayName? }` | `{ token, user: { id, email, role } }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | — | `{ user }` |

Password reset is manual (admin edits DB) for the demo — no endpoint needed.

## 2. Catalog (student)

| Method | Path | Notes | Response |
|--------|------|-------|----------|
| GET | `/chapters?grade=10&subject=math` | **Only `status: "approved"`** chapters; sorted by `sortOrder` | `Chapter[]` (omit `sourceText` for students) |
| GET | `/chapters/:id` | 404 if draft and requester is not admin | `Chapter` |

`Chapter` shape: see `lib/types.ts` (`grade`, `subject`, `title`, `sortOrder`,
`summary`, `moeysEmbedUrl`, `moeysCredit`, `status`, `questions[]`).

Questions include `correctIndex` + `explanation` because the quiz gives
immediate client-side feedback. If we later care about answer leaking, we can
split into a `/check` endpoint — not needed for demo.

## 3. ReanMate chat (study buddy)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/chapters/:id/messages` | — | `ChatMessage[]` (this user, this chapter) |
| POST | `/chapters/:id/messages` | `{ content }` | `{ userMessage: ChatMessage, assistantMessage: ChatMessage }` |

Backend responsibilities on POST:

1. Store the user message.
2. Call the AI provider (server-side key) with a Khmer **study-buddy** system prompt
   (មិត្ត AI — peer helper, not a teacher),
   grounded in the chapter's `sourceText` + `summary`. Instruct the model to
   admit when the answer is not in the material.
3. Store and return the assistant message.

The chat panel loads history from GET and appends via POST (Gemini on the backend).

## 4. Quiz

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/chapters/:id/quiz/attempts` | `{ answers: Record<questionId, optionIndex> }` | `QuizAttempt` + `{ chapterCompleted: boolean }` |
| GET | `/me/progress` | — | `ChapterProgress[]` |

Completion rule: an attempt with **score ≥ 70%** marks the chapter completed
(keep the earliest `completedAt`; store best score). The backend scores the
attempt from the stored `correctIndex` values; the client never sends a score.

## 5. Admin

All require `admin` role.

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/admin/chapters` | — | `Chapter[]` (drafts included, `sourceText` included) |
| GET | `/admin/chapters/:id` | — | `Chapter` (draft or approved, `sourceText` included) |
| POST | `/admin/chapters` | Chapter fields minus `id`/`questions` | `Chapter` |
| PATCH | `/admin/chapters/:id` | Partial chapter (incl. `status`, `questions`) | `Chapter` |
| POST | `/admin/chapters/:id/generate` | `{}` (uses stored `sourceText`) | `GeneratedChapterContent` = `{ summary, questions[] }` |

`generate` calls the AI provider to produce a Khmer summary + 5–10 MCQs
(each: `prompt`, `options[4]`, `correctIndex`, `explanation`) **from the
chapter's `sourceText`**. Admin edits then approves via PATCH.

## 6. Suggested Mongo collections

| Collection | Mirrors type | Notes |
|------------|--------------|-------|
| `users` | — | `email`, `passwordHash`, `role`, `displayName` |
| `chapters` | `Chapter` | embed `questions` array (small, read together) |
| `chatmessages` | `ChatMessage` | index `{ userId, chapterId, createdAt }` |
| `quizattempts` | `QuizAttempt` | index `{ userId, chapterId }` |
| `progress` | `ChapterProgress` | or derive from attempts |

## 7. Client-side only

The "continue where you left off" card (last-visited chapter) is kept in
`localStorage` per device. Everything else above is stored on the backend.
