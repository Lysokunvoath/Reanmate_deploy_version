import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { ChaptersModule } from './chapters/chapters.module.js';
import { ChatModule } from './chat/chat.module.js';
import { QuizModule } from './quiz/quiz.module.js';
import { TtsModule } from './tts/tts.module.js';
import { VersionModule } from './version/version.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ChaptersModule,
    ChatModule,
    QuizModule,
    TtsModule,
    VersionModule,
  ],
})
export class AppModule {}
