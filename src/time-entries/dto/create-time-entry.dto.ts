import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTimeEntryDto {
  @IsNotEmpty()
  taskId: string;

  @IsDateString()
  date: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
