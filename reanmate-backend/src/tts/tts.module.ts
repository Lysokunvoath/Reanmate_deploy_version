import { Module } from '@nestjs/common';
import { GeminiSpeechService } from './gemini-speech.service.js';
import { TtsController } from './tts.controller.js';
import { TtsService } from './tts.service.js';

@Module({
  controllers: [TtsController],
  providers: [TtsService, GeminiSpeechService],
})
export class TtsModule {}
