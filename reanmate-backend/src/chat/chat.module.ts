import { Module } from '@nestjs/common';
import { ChaptersModule } from '../chapters/chapters.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { GeminiModule } from './gemini.module.js';

@Module({
  imports: [ChaptersModule, GeminiModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
