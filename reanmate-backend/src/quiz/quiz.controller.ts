import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsObject } from 'class-validator';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.types.js';
import { QuizService } from './quiz.service.js';
import type { ChapterProgress, QuizAttempt } from './quiz.types.js';

class SubmitAttemptDto {
  /** questionId → selected option index; non-integer values are ignored when scoring. */
  @IsObject()
  answers!: Record<string, number>;
}

/** Quiz attempts and progress — API-CONTRACT.md §4. */
@Controller()
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Post('chapters/:id/quiz/attempts')
  async submit(
    @Param('id') chapterId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SubmitAttemptDto,
  ): Promise<QuizAttempt & { chapterCompleted: boolean }> {
    return this.quiz.submitAttempt(user.id, chapterId, body.answers);
  }

  @Get('me/progress')
  async progress(@CurrentUser() user: AuthUser): Promise<ChapterProgress[]> {
    return this.quiz.listProgress(user.id);
  }
}
