import { IsString, IsNotEmpty } from 'class-validator';

export class ImportQualificationDto {
  @IsString()
  @IsNotEmpty()
  qualificationCode: string;
}
