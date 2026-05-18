import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { TgaApiClient } from './tga-api.client';
import { TgaSyncService } from './tga-sync.service';

@Injectable()
export class TgaImportService {
  private readonly logger = new Logger(TgaImportService.name);

  constructor(
    private readonly tgaApiClient: TgaApiClient,
    private readonly tgaSyncService: TgaSyncService,
  ) {}

  async importQualification(
    rtoId: string,
    qualCode: string,
  ): Promise<{
    qualificationId: string;
    code: string;
    title: string;
    unitCount: number;
  }> {
    // 1. Fetch from TGA
    const tgaQual = await this.tgaApiClient.getQualificationDetail(qualCode);
    if (!tgaQual)
      throw new NotFoundException(`Qualification ${qualCode} not found on TGA`);

    // 2. Upsert Qualification
    const qual = await prisma.qualification.upsert({
      where: { code: qualCode },
      create: {
        code: tgaQual.code,
        title: tgaQual.title,
        status: tgaQual.status,
        superseded_by: tgaQual.supersededBy ?? null,
        training_package: tgaQual.trainingPackage?.code ?? null,
        tga_content_hash: this.tgaSyncService.computeQualificationHash(tgaQual),
        last_synced_at: new Date(),
      },
      update: {
        title: tgaQual.title,
        status: tgaQual.status,
        superseded_by: tgaQual.supersededBy ?? null,
        training_package: tgaQual.trainingPackage?.code ?? null,
        tga_content_hash: this.tgaSyncService.computeQualificationHash(tgaQual),
        last_synced_at: new Date(),
      },
    });

    // 3. Import all units
    const unitCodes = tgaQual.unitGroups.flatMap((g: any) =>
      g.units.map((u: any) => u.code),
    );
    let importedCount = 0;

    for (const unitCode of unitCodes) {
      try {
        const tgaUnit = await this.tgaApiClient.getUnitDetail(unitCode);
        if (!tgaUnit) {
          this.logger.warn(`Unit ${unitCode} not found on TGA, skipping`);
          continue;
        }

        // Upsert Unit
        const unit = await prisma.unit.upsert({
          where: { code: unitCode },
          create: {
            code: tgaUnit.code,
            title: tgaUnit.title,
            status: tgaUnit.status,
            superseded_by: tgaUnit.supersededBy ?? null,
            tga_content_hash: this.tgaSyncService.computeUnitHash(tgaUnit),
            last_synced_at: new Date(),
          },
          update: {
            title: tgaUnit.title,
            status: tgaUnit.status,
            superseded_by: tgaUnit.supersededBy ?? null,
            tga_content_hash: this.tgaSyncService.computeUnitHash(tgaUnit),
            last_synced_at: new Date(),
          },
        });

        // Replace UnitElements and PerformanceCriteria
        const existingElements = await prisma.unitElement.findMany({
          where: { unit_id: unit.id },
        });
        const existingElementIds = existingElements.map((e: any) => e.id);
        if (existingElementIds.length > 0) {
          await prisma.performanceCriterion.deleteMany({
            where: { element_id: { in: existingElementIds } },
          });
          await prisma.unitElement.deleteMany({ where: { unit_id: unit.id } });
        }

        for (const el of tgaUnit.elements) {
          const element = await prisma.unitElement.create({
            data: { unit_id: unit.id, element_num: el.num, title: el.title },
          });
          if (el.performanceCriteria.length > 0) {
            await prisma.performanceCriterion.createMany({
              data: el.performanceCriteria.map((pc: any) => ({
                element_id: element.id,
                pc_num: pc.num,
                text: pc.text,
              })),
            });
          }
        }

        // Upsert QualificationUnit
        await prisma.qualificationUnit.upsert({
          where: {
            qualification_id_unit_id: {
              qualification_id: qual.id,
              unit_id: unit.id,
            },
          },
          create: { qualification_id: qual.id, unit_id: unit.id },
          update: {},
        });

        importedCount++;
        await new Promise((r) => setTimeout(r, 50));
      } catch (err: any) {
        this.logger.warn(`Failed to import unit ${unitCode}: ${err.message}`);
      }
    }

    // 4. Upsert RtoQualification (clean up stubs)
    await prisma.rtoQualification.updateMany({
      where: { rto_id: rtoId, qualification_id: null, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    const existingRtoQual = await prisma.rtoQualification.findFirst({
      where: { rto_id: rtoId, qualification_id: qual.id, deleted_at: null },
    });

    if (existingRtoQual) {
      await prisma.rtoQualification.update({
        where: { id: existingRtoQual.id },
        data: { is_active: true },
      });
    } else {
      await prisma.rtoQualification.create({
        data: { rto_id: rtoId, qualification_id: qual.id, is_active: true },
      });
    }

    return {
      qualificationId: qual.id,
      code: qual.code,
      title: qual.title,
      unitCount: importedCount,
    };
  }
}
