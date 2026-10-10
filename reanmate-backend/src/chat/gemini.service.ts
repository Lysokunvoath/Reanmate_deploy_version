import { Injectable } from '@nestjs/common';
import { GoogleGenAI, MediaResolution } from '@google/genai';
import { vertexAuthOptions } from './vertex-credentials.js';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/**
 * Thin wrapper around the Vertex AI Gemini client. The client is built lazily
 * (not in the constructor) so a missing GOOGLE_CLOUD_PROJECT only fails a chat
 * request, not the whole app's startup — mirrors DatabaseService's `db` getter.
 */
@Injectable()
export class GeminiService {
  private client?: GoogleGenAI;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
      if (!project) {
        throw new Error('GOOGLE_CLOUD_PROJECT is required for the Vertex AI Gemini client.');
      }
      this.client = new GoogleGenAI({ vertexai: true, project, location, ...vertexAuthOptions() });
    }
    return this.client;
  }

  async generateReply(systemInstruction: string, history: ChatTurn[]): Promise<string> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const response = await this.getClient().models.generateContent({
      model,
      contents: history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      config: { systemInstruction },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  }

  /**
   * Single-turn request about a video. Low media resolution keeps long lesson
   * videos well under the model's input-token limit; slides and handwriting
   * stay readable at it.
   */
  async generateFromVideo(systemInstruction: string, videoUri: string, prompt: string): Promise<string> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const response = await this.getClient().models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ fileData: { fileUri: videoUri, mimeType: 'video/*' } }, { text: prompt }],
        },
      ],
      config: { systemInstruction, mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  }

  /** Single-turn request constrained to `jsonSchema`; returns the parsed JSON. */
  async generateJson<T>(systemInstruction: string, prompt: string, jsonSchema: object): Promise<T> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const response = await this.getClient().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned an empty response.');
    return JSON.parse(text) as T;
  }
}
