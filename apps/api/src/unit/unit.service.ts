import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { TgaApiClient } from '../tga/tga-api.client';

@Injectable()
export class UnitService {
  private readonly logger = new Logger(UnitService.name);

  constructor(private readonly tgaApiClient: TgaApiClient) {}

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

    if (unit.elements.length === 0 && unit.code) {
      await this.backfillElements(unit.id, unit.code);
      return prisma.unit.findUnique({
        where: { id: unitId },
        include: {
          elements: {
            include: {
              performance_criteria: { orderBy: { pc_num: 'asc' } },
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
    }

    return unit;
  }

  private async backfillElements(unitId: string, code: string): Promise<void> {
    try {
      const detail = await this.tgaApiClient.getUnitDetail(code);
      if (!detail || detail.elements.length === 0) return;

      for (const elem of detail.elements) {
        const newElem = await prisma.unitElement.create({
          data: {
            unit_id: unitId,
            element_num: elem.num,
            title: elem.title,
          },
        });

        if (elem.performanceCriteria.length > 0) {
          await prisma.performanceCriterion.createMany({
            data: elem.performanceCriteria.map((pc) => ({
              element_id: newElem.id,
              pc_num: pc.num,
              text: pc.text,
            })),
          });
        }
      }

      await prisma.unit.update({
        where: { id: unitId },
        data: {
          status: detail.status ?? undefined,
          last_synced_at: new Date(),
        },
      });
    } catch (err: any) {
      this.logger.warn(`Element backfill failed for ${code}: ${err.message}`);
    }
  }
}
