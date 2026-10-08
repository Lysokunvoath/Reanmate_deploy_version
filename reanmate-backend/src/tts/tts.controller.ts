import { Body, Controller, Header, HttpCode, Post, StreamableFile } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../auth/auth.decorators.js';
import type { AuthUser } from '../auth/auth.types.js';
import { TtsService } from './tts.service.js';

class SynthesizeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text!: string;
}

/** Text-to-speech for the Listen button: returns MP3 audio (Khmer via Gemini TTS). */
@Controller('tts')
export class TtsController {
  constructor(private readonly tts: TtsService) {}

  @Post()
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  async synthesize(@CurrentUser() user: AuthUser, @Body() body: SynthesizeDto): Promise<StreamableFile> {
    const audio = await this.tts.synthesize(user.id, body.text);
    return new StreamableFile(audio, { type: 'audio/mpeg', length: audio.length });
  }
}
