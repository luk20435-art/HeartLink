import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { KnowledgeType } from '../../knowledge/knowledge-type.enum';
import type { KnowledgeSessionResult } from '../knowledge-session.entity';

export class CreateKnowledgeSessionDto {
  @IsDateString()
  givenDate: string;

  @IsEnum(KnowledgeType)
  mediaType: KnowledgeType;

  @IsUUID()
  knowledgeItemId: string;

  @IsEnum(['given', 'other'])
  result: KnowledgeSessionResult;

  @IsOptional()
  @IsString()
  note?: string;
}
