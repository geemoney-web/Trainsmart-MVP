import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  ArrayMinSize,
} from 'class-validator';

export class CreateRtoDto {
  @IsString()
  name: string;

  @Matches(/^\d{5}$/, { message: 'ASQA code must be a 5-digit number.' })
  asqa_code: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  operating_states: string[];

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;
}
