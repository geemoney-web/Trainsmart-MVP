import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateRtoDto } from './dto/create-rto.dto';
import { UpdateRtoDto } from './dto/update-rto.dto';

@Injectable()
export class RtoService {
  async findAll() {
    const rows = await prisma.rto.findMany({
      where: { deleted_at: null },
      include: {
        _count: {
          select: {
            alerts: { where: { resolved: false, deleted_at: null } },
            validations: {
              where: { planned_date: { gte: new Date() }, deleted_at: null },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return rows.map((r) => ({
      ...r,
      superseded_quals_count: 0, // DASH-04 placeholder — Phase 5 replaces with real computation
      tas_review_count: 0,       // DASH-05 placeholder — Phase 5
      trainer_alerts_count: 0,   // DASH-06 placeholder — Phase 5
    }));
  }

  async findOne(id: string) {
    const rto = await prisma.rto.findFirst({
      where: { id, deleted_at: null },
      include: {
        qualifications: true,
        trainers: true,
        tas_documents: true,
        validations: true,
        documents: true,
        tasks: true,
        alerts: true,
        notes: true,
      },
    });
    if (!rto) throw new NotFoundException('RTO not found');
    return {
      ...rto,
      superseded_quals_count: 0, // DASH-04 placeholder — Phase 5
      tas_review_count: 0,       // DASH-05 placeholder — Phase 5
      trainer_alerts_count: 0,   // DASH-06 placeholder — Phase 5
    };
  }

  async create(dto: CreateRtoDto) {
    return prisma.$transaction(async (tx) => {
      const rto = await tx.rto.create({ data: dto });

      // RTO-02 workspace provisioning stubs
      await tx.rtoQualification.create({ data: { rto_id: rto.id } });
      await tx.trainer.create({ data: { rto_id: rto.id, full_name: '(placeholder)' } });
      await tx.tasDocument.create({ data: { rto_id: rto.id } });
      await tx.validation.create({ data: { rto_id: rto.id, status: 'Scheduled' } });
      await tx.document.create({ data: { rto_id: rto.id, file_key: 'placeholder', file_name: 'placeholder.txt' } });
      await tx.task.create({ data: { rto_id: rto.id, title: '(placeholder)' } });
      await tx.note.create({ data: { rto_id: rto.id, content: '(workspace initialised)' } });

      return rto;
    });
  }

  async update(id: string, dto: UpdateRtoDto) {
    return prisma.rto.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return prisma.rto.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}
