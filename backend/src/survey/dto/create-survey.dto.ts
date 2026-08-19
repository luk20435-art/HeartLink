import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSurveyDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q1: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q2: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q3: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q4: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q5: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q6: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q7: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q8: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q9: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q10: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q11: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q12: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q13: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q14: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q15: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q16: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q17: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q18: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q19: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) q20: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
