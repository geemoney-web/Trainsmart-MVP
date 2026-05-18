import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RtoService } from './rto.service';
import { CreateRtoDto } from './dto/create-rto.dto';
import { UpdateRtoDto } from './dto/update-rto.dto';

@Controller('rtos')
export class RtoController {
  constructor(private readonly rtoService: RtoService) {}

  @Get()
  findAll() {
    return this.rtoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rtoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateRtoDto) {
    return this.rtoService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRtoDto) {
    return this.rtoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rtoService.remove(id);
  }
}
