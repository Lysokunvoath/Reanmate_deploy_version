import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service.js';

/** Shared Vertex AI Gemini client — used by chat and admin chapter generation. */
@Module({
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
