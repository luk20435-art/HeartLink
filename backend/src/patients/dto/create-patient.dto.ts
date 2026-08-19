import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { PatientSex } from '../patient-sex.enum';

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  age: number;

  @IsEnum(PatientSex)
  sex: PatientSex;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  treatmentRight?: string;

  @IsOptional()
  @IsBoolean()
  smoker?: boolean;

  @IsOptional()
  @Type(() => Number)
  heightCm?: number;
}
