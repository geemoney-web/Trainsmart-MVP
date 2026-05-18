import { PartialType } from '@nestjs/swagger';
import { CreateRtoDto } from './create-rto.dto';

export class UpdateRtoDto extends PartialType(CreateRtoDto) {}
