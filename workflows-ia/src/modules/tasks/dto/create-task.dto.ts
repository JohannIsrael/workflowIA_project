import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  assignedTo?: string | null;

  @IsOptional()
  @IsNumber()
  sprint?: number | null;

  @IsUUID()
  projectId: string;
}
