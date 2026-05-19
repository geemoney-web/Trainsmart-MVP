import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsIn,
  IsOptional,
  IsInt,
  IsDateString,
  IsArray,
  Max,
} from 'class-validator';

export class CreateTasDto {
  @IsUUID()
  rtoId: string;

  @IsUUID()
  qualificationId: string;

  @IsString()
  @IsNotEmpty()
  versionLabel: string;

  @IsIn(['Draft', 'Current', 'Archived'])
  status: 'Draft' | 'Current' | 'Archived';

  @IsString()
  @IsNotEmpty()
  fileKey: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsInt()
  @Max(52_428_800) // 50 MB
  fileSize: number;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  unitIds?: string[];

  @IsOptional()
  @IsUUID()
  uploadedById?: string;
}
