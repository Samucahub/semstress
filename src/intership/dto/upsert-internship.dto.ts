import { IsDateString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class UpsertInternshipDto {
  @IsNotEmpty()
  company: string;

  @IsNotEmpty()
  institute: string;

  @IsOptional()
  companyMentor?: string;

  @IsOptional()
  instituteMentor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalHours?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
