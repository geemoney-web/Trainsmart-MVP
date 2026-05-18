import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { prisma } from '@repo/db';
import { TgaApiClient } from './tga-api.client';
import type { TgaQualificationDetail } from './dto/tga-qualification.dto';
import type { TgaUnitDetail } from './dto/tga-unit.dto';

@Injectable()
export class TgaSyncService {
  private readonly logger = new Logger(TgaSyncService.name);

  constructor(private readonly tgaApiClient: TgaApiClient) {}

  // --- Hash computation (public for Plan 04 TgaImportService) ---

  computeQualificationHash(tgaData: TgaQualificationDetail): string {
    const fields = {
      title: tgaData.title,
      status: tgaData.status,
      supersededBy: tgaData.supersededBy,
      trainingPackage: tgaData.trainingPackage?.code ?? null,
    };
    return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
  }

  computeUnitHash(tgaData: TgaUnitDetail): string {
    const fields = {
      title: tgaData.title,
      status: tgaData.status,
      supersededBy: tgaData.supersededBy,
      elements: tgaData.elements.map((e: { num: string; title: string; performanceCriteria: Array<{ num: string; text: string }> }) => ({
        num: e.num,
        title: e.title,
        pcs: e.performanceCriteria.map((pc: { num: string; text: string }) => ({ num: pc.num, text: pc.text })),
      })),
    };
    return createHash('sha256').update(JSON.stringify(fields)).digest('hex');
  }

  // --- Alert deduplication ---

  private async createAlertIfNotExists(data: {
    rto_id: string;
    alert_type: string;
    severity: string;
    entity_type: string;
    entity_id: string;
    title: string;
    description: string;
  }): Promise<boolean> {
    const existing = await prisma.complianceAlert.findFirst({
      where: {
        rto_id: data.rto_id,
        alert_type: data.alert_type,
        entity_id: data.entity_id,
        resolved: false,
        deleted_at: null,
      },
    });
    if (existing) return false;
    await prisma.complianceAlert.create({ data: { ...data, resolved: false } });
    return true;
  }

  // --- RTO status_color update ---

  private async updateRtoStatusColor(rtoId: string): Promise<void> {
    const alerts = await prisma.complianceAlert.findMany({
      where: { rto_id: rtoId, resolved: false, deleted_at: null },
      select: { severity: true },
    });
    let color = 'green';
    if (alerts.some((a: any) => a.severity === 'red')) color = 'red';
    else if (alerts.some((a: any) => a.severity === 'amber')) color = 'amber';
    await prisma.rto.update({ where: { id: rtoId }, data: { status_color: color } });
  }

  // --- Sync a single qualification by code ---

  async syncQualification(
    qualCode: string,
    syncLogId: string,
  ): Promise<{ changed: boolean; alertsCreated: number }> {
    const tgaQual = await this.tgaApiClient.getQualificationDetail(qualCode);
    if (!tgaQual) {
      this.logger.warn(`TGA returned null for qualification ${qualCode} (syncLog: ${syncLogId})`);
      return { changed: false, alertsCreated: 0 };
    }

    const existingQual = await prisma.qualification.findUnique({
      where: { code: qualCode },
    });

    const newHash = this.computeQualificationHash(tgaQual);

    // First-time insert — no change event to alert on
    if (!existingQual) {
      await prisma.qualification.create({
        data: {
          code: tgaQual.code,
          title: tgaQual.title,
          status: tgaQual.status,
          superseded_by: tgaQual.supersededBy,
          training_package: tgaQual.trainingPackage?.code ?? null,
          tga_content_hash: newHash,
          last_synced_at: new Date(),
        },
      });
      return { changed: false, alertsCreated: 0 };
    }

    // No change
    if (existingQual.tga_content_hash === newHash) {
      return { changed: false, alertsCreated: 0 };
    }

    // --- Detected change ---

    // Determine which fields differ
    const changeFields: string[] = [];
    if (existingQual.title !== tgaQual.title) changeFields.push('title');
    if (existingQual.status !== tgaQual.status) changeFields.push('status');
    if (existingQual.superseded_by !== tgaQual.supersededBy) changeFields.push('supersededBy');
    if (existingQual.training_package !== (tgaQual.trainingPackage?.code ?? null)) {
      changeFields.push('trainingPackage');
    }

    // Snapshot previous state
    await prisma.qualificationSnapshot.create({
      data: {
        qualification_id: existingQual.id,
        snapshot_data: existingQual as any,
        change_fields: changeFields,
      },
    });

    // Update qualification record
    await prisma.qualification.update({
      where: { id: existingQual.id },
      data: {
        title: tgaQual.title,
        status: tgaQual.status,
        superseded_by: tgaQual.supersededBy,
        training_package: tgaQual.trainingPackage?.code ?? null,
        tga_content_hash: newHash,
        last_synced_at: new Date(),
      },
    });

    // Find affected RTOs
    const affectedRtoQuals = await prisma.rtoQualification.findMany({
      where: {
        qualification_id: existingQual.id,
        deleted_at: null,
        is_active: true,
      },
    });

    let alertsCreated = 0;

    for (const rtoQual of affectedRtoQuals) {
      const statusLower = tgaQual.status.toLowerCase();
      if (statusLower === 'superseded') {
        const created = await this.createAlertIfNotExists({
          rto_id: rtoQual.rto_id,
          alert_type: 'QUAL_SUPERSEDED',
          severity: 'red',
          entity_type: 'qualification',
          entity_id: existingQual.id,
          title: `Qualification ${qualCode} has been superseded`,
          description: tgaQual.supersededBy
            ? `This qualification has been superseded by ${tgaQual.supersededBy}. Review and update the RTO's scope accordingly.`
            : `This qualification has been superseded. Review and update the RTO's scope accordingly.`,
        });
        if (created) alertsCreated++;
      }

      if (changeFields.includes('title')) {
        const created = await this.createAlertIfNotExists({
          rto_id: rtoQual.rto_id,
          alert_type: 'QUAL_WORDING_CHANGED',
          severity: 'amber',
          entity_type: 'qualification',
          entity_id: existingQual.id,
          title: `Qualification ${qualCode} title has changed`,
          description: `TGA has updated the title of this qualification from "${existingQual.title}" to "${tgaQual.title}". Review affected TAS documents.`,
        });
        if (created) alertsCreated++;
      }

      await this.updateRtoStatusColor(rtoQual.rto_id);
    }

    return { changed: true, alertsCreated };
  }

  // --- Sync a single unit by code ---

  async syncUnit(
    unitCode: string,
    syncLogId: string,
  ): Promise<{ changed: boolean; alertsCreated: number }> {
    const tgaUnit = await this.tgaApiClient.getUnitDetail(unitCode);
    if (!tgaUnit) {
      this.logger.warn(`TGA returned null for unit ${unitCode} (syncLog: ${syncLogId})`);
      return { changed: false, alertsCreated: 0 };
    }

    const existingUnit = await prisma.unit.findUnique({
      where: { code: unitCode },
    });

    const newHash = this.computeUnitHash(tgaUnit);

    // First-time insert
    if (!existingUnit) {
      const newUnit = await prisma.unit.create({
        data: {
          code: tgaUnit.code,
          title: tgaUnit.title,
          status: tgaUnit.status,
          superseded_by: tgaUnit.supersededBy,
          tga_content_hash: newHash,
          last_synced_at: new Date(),
        },
      });

      // Insert elements and PCs
      for (const elem of tgaUnit.elements) {
        const newElem = await prisma.unitElement.create({
          data: {
            unit_id: newUnit.id,
            element_num: elem.num,
            title: elem.title,
          },
        });
        for (const pc of elem.performanceCriteria) {
          await prisma.performanceCriterion.create({
            data: {
              element_id: newElem.id,
              pc_num: pc.num,
              text: pc.text,
            },
          });
        }
      }

      return { changed: false, alertsCreated: 0 };
    }

    // No change
    if (existingUnit.tga_content_hash === newHash) {
      return { changed: false, alertsCreated: 0 };
    }

    // --- Detected change ---

    // Fetch current elements for snapshot (before deleting them)
    const currentElements = await prisma.unitElement.findMany({
      where: { unit_id: existingUnit.id },
      include: { performance_criteria: true },
    });

    // Snapshot previous state
    await prisma.unitSnapshot.create({
      data: {
        unit_id: existingUnit.id,
        snapshot_data: { ...existingUnit, elements: currentElements } as any,
        change_fields: ['elements'], // elements/PCs are the primary change surface
      },
    });

    // Delete old PCs then elements
    const elementIds = currentElements.map((e) => e.id);
    await prisma.performanceCriterion.deleteMany({
      where: { element_id: { in: elementIds } },
    });
    await prisma.unitElement.deleteMany({ where: { unit_id: existingUnit.id } });

    // Insert new elements and PCs
    for (const elem of tgaUnit.elements) {
      const newElem = await prisma.unitElement.create({
        data: {
          unit_id: existingUnit.id,
          element_num: elem.num,
          title: elem.title,
        },
      });
      for (const pc of elem.performanceCriteria) {
        await prisma.performanceCriterion.create({
          data: {
            element_id: newElem.id,
            pc_num: pc.num,
            text: pc.text,
          },
        });
      }
    }

    // Update unit record
    await prisma.unit.update({
      where: { id: existingUnit.id },
      data: {
        title: tgaUnit.title,
        status: tgaUnit.status,
        superseded_by: tgaUnit.supersededBy,
        tga_content_hash: newHash,
        last_synced_at: new Date(),
      },
    });

    // Find affected RTOs via QualificationUnit → RtoQualification chain
    const qualUnits = await prisma.qualificationUnit.findMany({
      where: { unit_id: existingUnit.id },
      select: { qualification_id: true },
    });
    const qualIds = qualUnits.map((qu) => qu.qualification_id);

    const rtoQuals = await prisma.rtoQualification.findMany({
      where: {
        qualification_id: { in: qualIds },
        deleted_at: null,
        is_active: true,
      },
      select: { rto_id: true },
    });
    const uniqueRtoIds = [...new Set(rtoQuals.map((rq) => rq.rto_id))];

    let alertsCreated = 0;

    for (const rtoId of uniqueRtoIds) {
      const created = await this.createAlertIfNotExists({
        rto_id: rtoId,
        alert_type: 'UNIT_WORDING_CHANGED',
        severity: 'amber',
        entity_type: 'unit',
        entity_id: existingUnit.id,
        title: `Unit ${unitCode} content updated`,
        description:
          'TGA has updated element or performance criteria wording for this unit.',
      });
      if (created) alertsCreated++;
      await this.updateRtoStatusColor(rtoId);
    }

    return { changed: true, alertsCreated };
  }

  // --- Sync log helpers (used by Plan 03 controller) ---

  async getRunningSync(): Promise<any | null> {
    return prisma.syncLog.findFirst({ where: { status: 'running' } });
  }

  async startSync(triggeredBy: string): Promise<string> {
    const log = await prisma.syncLog.create({
      data: { triggered_by: triggeredBy, status: 'running' },
    });
    return log.id;
  }

  async getSyncStatus(syncLogId: string): Promise<any> {
    const log = await prisma.syncLog.findUnique({ where: { id: syncLogId } });
    if (!log) throw new Error('SyncLog not found');
    return {
      status: log.status,
      qualsChecked: log.quals_checked,
      qualsChanged: log.quals_changed,
      unitsChecked: log.units_checked,
      unitsChanged: log.units_changed,
      alertsCreated: log.alerts_created,
      startedAt: log.started_at,
      completedAt: log.completed_at,
      errorMessage: log.error_message,
    };
  }

  async getSyncHistory(limit: number): Promise<any[]> {
    return prisma.syncLog.findMany({
      orderBy: { started_at: 'desc' },
      take: limit,
      select: {
        id: true,
        triggered_by: true,
        status: true,
        quals_changed: true,
        units_changed: true,
        alerts_created: true,
        started_at: true,
        completed_at: true,
      },
    });
  }

  // --- Full sync: all known qualifications and units ---

  async syncAll(triggeredBy: string, existingSyncLogId?: string): Promise<any> {
    const syncLogId = existingSyncLogId ?? (await this.startSync(triggeredBy));
    const counts = {
      qualsChecked: 0,
      qualsChanged: 0,
      unitsChecked: 0,
      unitsChanged: 0,
      alertsCreated: 0,
    };

    try {
      const quals = await prisma.qualification.findMany({ select: { code: true } });
      for (const q of quals) {
        const result = await this.syncQualification(q.code, syncLogId);
        counts.qualsChecked++;
        if (result.changed) counts.qualsChanged++;
        counts.alertsCreated += result.alertsCreated;
        await new Promise((r) => setTimeout(r, 100));
      }

      const units = await prisma.unit.findMany({ select: { code: true } });
      for (const u of units) {
        const result = await this.syncUnit(u.code, syncLogId);
        counts.unitsChecked++;
        if (result.changed) counts.unitsChanged++;
        counts.alertsCreated += result.alertsCreated;
        await new Promise((r) => setTimeout(r, 100));
      }

      await prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          status: 'completed',
          quals_checked: counts.qualsChecked,
          quals_changed: counts.qualsChanged,
          units_checked: counts.unitsChecked,
          units_changed: counts.unitsChanged,
          alerts_created: counts.alertsCreated,
          completed_at: new Date(),
        },
      });
    } catch (error: any) {
      await prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          status: 'failed',
          error_message: error.message,
          completed_at: new Date(),
        },
      });
      throw error;
    }

    return counts;
  }
}
