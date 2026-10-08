import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.types.js';
import { ChatService } from './chat.service.js';
import type { ChatMessage } from './chat.types.js';

class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}

/** ReanMate chat (study buddy) — API-CONTRACT.md §3. */
@Controller('chapters/:id/messages')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  async list(@Param('id') chapterId: string, @CurrentUser() user: AuthUser): Promise<ChatMessage[]> {
    return this.chat.listMessages(user.id, chapterId);
  }

  @Post()
  async send(
    @Param('id') chapterId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SendMessageDto,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    return this.chat.sendMessage(user.id, chapterId, body.content.trim());
  }
}
