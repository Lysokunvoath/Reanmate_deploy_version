import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Mp3Encoder } from '@breezystack/lamejs';
import { vertexAuthOptions } from '../chat/vertex-credentials.js';

// Gemini TTS returns 16-bit mono PCM at 24 kHz.
const SAMPLE_RATE = 24000;
// Low bitrate keeps cached clips small (~4 KB per second of speech).
const MP3_KBPS = 32;
const MP3_FRAME_SAMPLES = 1152;

/**
 * Text-to-speech through Vertex AI Gemini TTS, reusing the chat's Google Cloud
 * project and credentials. Khmer is not on Gemini-TTS's official language list
 * but is read clearly in testing; the frontend falls back to the browser voice
 * if this fails. The client is built lazily, like GeminiService.
 */
@Injectable()
export class GeminiSpeechService {
  private client?: GoogleGenAI;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
      if (!project) {
        throw new Error('GOOGLE_CLOUD_PROJECT is required for Gemini text-to-speech.');
      }
      this.client = new GoogleGenAI({ vertexai: true, project, location, ...vertexAuthOptions() });
    }
    return this.client;
  }

  /** Returns MP3 audio of the text read by the given prebuilt voice. */
  async synthesize(text: string, voice: string, isKhmer: boolean): Promise<Buffer> {
    const model = process.env.GEMINI_TTS_MODEL ?? 'gemini-2.5-flash-tts';
    const response = await this.getClient().models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${isKhmer ? 'Read aloud in Khmer' : 'Read aloud'}: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const data = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data;
    if (!data) throw new Error('Gemini TTS returned no audio.');
    return encodeMp3(Buffer.from(data, 'base64'));
  }
}

function encodeMp3(pcm: Buffer): Buffer {
  // Copy out of Node's shared buffer pool, whose offsets may not be 2-byte aligned.
  const byteLength = pcm.length - (pcm.length % 2);
  const samples = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + byteLength));
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, MP3_KBPS);
  const chunks: Buffer[] = [];
  // lamejs actually returns Int8Array (its typings say Uint8Array); view as bytes.
  const toBuffer = (chunk: ArrayBufferView) => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  for (let i = 0; i < samples.length; i += MP3_FRAME_SAMPLES) {
    chunks.push(toBuffer(encoder.encodeBuffer(samples.subarray(i, i + MP3_FRAME_SAMPLES))));
  }
  chunks.push(toBuffer(encoder.flush()));
  return Buffer.concat(chunks);
}
