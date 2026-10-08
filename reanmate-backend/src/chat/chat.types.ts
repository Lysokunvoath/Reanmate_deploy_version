export type ChatRole = 'user' | 'assistant';

/** Shape the frontend expects — mirrors `ChatMessage` in frontend/lib/types.ts. */
export interface ChatMessage {
  id: string;
  chapterId: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO timestamp
}
