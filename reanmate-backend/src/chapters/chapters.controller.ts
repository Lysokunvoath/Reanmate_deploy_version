import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Public, Roles } from '../auth/auth.decorators.js';
import { ChaptersService } from './chapters.service.js';
import type { Chapter, ChapterStatus, GeneratedChapterContent, Grade, SubjectId } from './chapter.types.js';

const GRADES: Grade[] = [10, 11, 12];
const SUBJECTS: SubjectId[] = ['math', 'history'];
const STATUSES: ChapterStatus[] = ['draft', 'approved'];

class QuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(5)
  correctIndex!: number;

  @IsString()
  @MaxLength(4000)
  explanation!: string;
}

class UpdateChapterDto {
  @IsOptional()
  @IsIn(GRADES)
  grade?: Grade;

  @IsOptional()
  @IsIn(SUBJECTS)
  subject?: SubjectId;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200000)
  sourceText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  moeysEmbedUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  moeysCredit?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: ChapterStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}

class CreateChapterDto extends UpdateChapterDto {
  @IsIn(GRADES)
  declare grade: Grade;

  @IsIn(SUBJECTS)
  declare subject: SubjectId;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  declare title: string;
}

@Controller()
export class ChaptersController {
  constructor(private readonly chapters: ChaptersService) {}

  @Public()
  @Get('chapters')
  async approvedChapters(
    @Query('grade') gradeParam: string,
    @Query('subject') subjectParam: SubjectId,
  ): Promise<Chapter[]> {
    const grade = Number(gradeParam) as Grade;
    if (!GRADES.includes(grade) || !SUBJECTS.includes(subjectParam)) {
      throw new BadRequestException('Invalid grade or subject.');
    }
    return this.chapters.findApproved(grade, subjectParam);
  }

  @Public()
  @Get('chapters/:id')
  async chapter(@Param('id') id: string): Promise<Chapter> {
    const chapter = await this.chapters.findById(id);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    return chapter;
  }

  @Roles('admin')
  @Get('admin/chapters')
  async adminChapters(): Promise<Chapter[]> {
    return this.chapters.findAllForAdmin();
  }

  @Roles('admin')
  @Get('admin/chapters/:id')
  async adminChapter(@Param('id') id: string): Promise<Chapter> {
    const chapter = await this.chapters.findById(id, true);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    return chapter;
  }

  @Roles('admin')
  @Post('admin/chapters')
  async createChapter(@Body() body: CreateChapterDto): Promise<Chapter> {
    // Inherited @IsOptional() skips the stricter checks when a field is absent.
    if (!body.grade || !body.subject || !body.title?.trim()) {
      throw new BadRequestException('grade, subject and title are required.');
    }
    if (body.status === 'approved' && (!body.summary?.trim() || !body.questions?.length)) {
      throw new BadRequestException('ត្រូវការចំណងជើង សង្ខេប និងសំណួរ សិនទើបអនុម័តបាន។');
    }
    return this.chapters.create({
      grade: body.grade,
      subject: body.subject,
      title: body.title.trim(),
      sortOrder: body.sortOrder ?? 1,
      summary: body.summary ?? '',
      sourceText: body.sourceText ?? '',
      moeysEmbedUrl: body.moeysEmbedUrl ?? '',
      moeysCredit: body.moeysCredit ?? '',
      status: body.status ?? 'draft',
      questions: body.questions ?? [],
    });
  }

  @Roles('admin')
  @Patch('admin/chapters/:id')
  async updateChapter(@Param('id') id: string, @Body() body: UpdateChapterDto): Promise<Chapter> {
    const existing = await this.chapters.findById(id, true);
    if (!existing) throw new NotFoundException('Chapter not found.');
    // DTO class fields default to undefined; drop them so a partial PATCH
    // doesn't overwrite stored values.
    const patch = Object.fromEntries(
      Object.entries(body).filter(([, value]) => value !== undefined),
    ) as UpdateChapterDto;
    const next = { ...existing, ...patch };
    if (next.status === 'approved' && (!next.title.trim() || !next.summary.trim() || next.questions.length === 0)) {
      throw new BadRequestException('ត្រូវការចំណងជើង សង្ខេប និងសំណួរ សិនទើបអនុម័តបាន។');
    }
    const updated = await this.chapters.update(id, patch);
    if (!updated) throw new NotFoundException('Chapter not found.');
    return updated;
  }

  @Roles('admin')
  @Post('admin/chapters/:id/generate')
  async generate(@Param('id') id: string): Promise<GeneratedChapterContent> {
    const chapter = await this.chapters.findById(id, true);
    if (!chapter) throw new NotFoundException('Chapter not found.');
    if (!chapter.sourceText.trim()) {
      throw new BadRequestException('សូមបិទភ្ជាប់អត្ថបទប្រភពជាមុនសិន។');
    }
    try {
      return await this.chapters.generateContent(chapter);
    } catch (error) {
      console.error('[Chapters] Gemini generation failed:', error);
      throw new BadGatewayException('AI មិនអាចបង្កើតខ្លឹមសារបានទេពេលនេះ សូមសាកល្បងម្តងទៀត។');
    }
  }
}
