import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { vertexAuthOptions } from './vertex-credentials.js';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface VideoPart {
  fileData: {
    fileUri: string;
    mimeType: 'video/*';
  };
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

  async generateReply(systemInstruction: string, history: ChatTurn[], videoUri?: string): Promise<string> {
    const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
    const response = await this.getClient().models.generateContent({
      model,
      contents: history.map((turn, index) => ({
        role: turn.role,
        parts: [
          ...(index === 0 && videoUri ? [{ fileData: { fileUri: videoUri, mimeType: 'video/*' } }] : []),
          { text: turn.text },
        ] as Array<{ text: string } | VideoPart>,
      })),
      config: { systemInstruction },
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
