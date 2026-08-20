import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class SaveHealthRecordDto {
  @IsDateString()
  visitDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  systolicBp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  diastolicBp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  heartRate?: number;

  @IsOptional()
  @Type(() => Number)
  waistCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dtxFpg?: number;

  @IsOptional()
  @IsIn(['good', 'needs_improvement'])
  selfCareBehavior?: 'good' | 'needs_improvement';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  q1Depressed?: boolean;

  @IsOptional()
  @IsBoolean()
  q2Anhedonia?: boolean;
}
