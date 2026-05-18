import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class UnitService {
  async findOne(unitId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        elements: {
          include: {
            performance_criteria: {
              orderBy: { pc_num: 'asc' },
            },
          },
          orderBy: { element_num: 'asc' },
        },
        snapshots: {
          orderBy: { snapshotted_at: 'desc' },
          select: {
            id: true,
            snapshotted_at: true,
            change_fields: true,
            snapshot_data: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }
}
