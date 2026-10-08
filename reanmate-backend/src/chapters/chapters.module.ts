import { Module } from '@nestjs/common';
import { GeminiModule } from '../chat/gemini.module.js';
import { ChaptersController } from './chapters.controller.js';
import { ChaptersService } from './chapters.service.js';

@Module({
  imports: [GeminiModule],
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
