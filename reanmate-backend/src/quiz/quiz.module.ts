import { Module } from '@nestjs/common';
import { ChaptersModule } from '../chapters/chapters.module.js';
import { QuizController } from './quiz.controller.js';
import { QuizService } from './quiz.service.js';

@Module({
  imports: [ChaptersModule],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
