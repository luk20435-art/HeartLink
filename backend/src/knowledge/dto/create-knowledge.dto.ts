import { IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { KnowledgeType } from '../knowledge-type.enum';

export class CreateKnowledgeDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsEnum(KnowledgeType)
  type: KnowledgeType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
