import { IsString, IsOptional, IsBoolean, IsArray, IsUUID, ValidateIf } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.taskId)
  projectId?: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.projectId)
  taskId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
