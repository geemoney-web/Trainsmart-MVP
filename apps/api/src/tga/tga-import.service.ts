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

    // 3. Import all units from the qualification's unitGroups
    // Use the unit stubs (code + title) already in the qual response — no per-unit TGA calls.
    // Elements/PCs are fetched lazily when viewing the unit detail page (Phase 3).
    const unitStubs = tgaQual.unitGroups.flatMap((g: any) =>
      g.units.map((u: any) => ({ code: u.code as string, title: u.title as string })),
    );
    let importedCount = 0;

    for (const stub of unitStubs) {
      try {
        const unit = await prisma.unit.upsert({
          where: { code: stub.code },
          create: {
            code: stub.code,
            title: stub.title,
            status: 'unknown',
            tga_content_hash: '',
          },
          update: {
            title: stub.title,
          },
        });

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
      } catch (err: any) {
        this.logger.warn(`Failed to import unit ${stub.code}: ${err.message}`);
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
