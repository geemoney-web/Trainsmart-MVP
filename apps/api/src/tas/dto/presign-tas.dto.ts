import { IsUUID, IsString, IsNotEmpty, IsIn, IsInt, Max } from 'class-validator';

export class PresignTasDto {
  @IsUUID()
  rtoId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsInt()
  @Max(52_428_800)
  fileSize: number;

  @IsIn([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ])
  contentType: string;
}
