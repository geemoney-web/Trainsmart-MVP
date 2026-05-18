import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UnitController } from '../unit.controller';
import { UnitService } from '../unit.service';

describe('UnitController', () => {
  let controller: UnitController;
  let service: { findOne: jest.Mock };

  const mockUnit = {
    id: 'unit-111',
    code: 'BSBWHS311',
    title: 'Assist with maintaining workplace safety',
    status: 'Current',
    superseded_by: null,
    tga_content_hash: 'def456',
    last_synced_at: new Date('2025-01-01'),
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    elements: [
      {
        id: 'elem-1',
        unit_id: 'unit-111',
        element_num: '1',
        title: 'Identify safety hazards',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
        performance_criteria: [
          {
            id: 'pc-1',
            element_id: 'elem-1',
            pc_num: '1.1',
            text: 'Hazards are identified in accordance with WHS procedures',
            created_at: new Date('2025-01-01'),
            updated_at: new Date('2025-01-01'),
          },
          {
            id: 'pc-2',
            element_id: 'elem-1',
            pc_num: '1.2',
            text: 'Hazards are reported to supervisor',
            created_at: new Date('2025-01-01'),
            updated_at: new Date('2025-01-01'),
          },
        ],
      },
      {
        id: 'elem-2',
        unit_id: 'unit-111',
        element_num: '2',
        title: 'Follow safe work practices',
        created_at: new Date('2025-01-01'),
        updated_at: new Date('2025-01-01'),
        performance_criteria: [
          {
            id: 'pc-3',
            element_id: 'elem-2',
            pc_num: '2.1',
            text: 'Safe work practices are followed',
            created_at: new Date('2025-01-01'),
            updated_at: new Date('2025-01-01'),
          },
        ],
      },
    ],
    snapshots: [
      {
        id: 'snap-2',
        snapshotted_at: new Date('2025-06-01'),
        change_fields: ['title'],
        snapshot_data: {
          id: 'unit-111',
          code: 'BSBWHS311',
          title: 'Old title',
          status: 'Current',
          superseded_by: null,
          elements: [
            {
              element_num: '1',
              title: 'Identify safety hazards',
              performance_criteria: [{ pc_num: '1.1', text: 'Old text' }],
            },
          ],
        },
      },
      {
        id: 'snap-1',
        snapshotted_at: new Date('2025-01-01'),
        change_fields: ['status'],
        snapshot_data: {
          id: 'unit-111',
          code: 'BSBWHS311',
          title: 'Original title',
          status: 'Draft',
          superseded_by: null,
          elements: [],
        },
      },
    ],
  };

  beforeEach(async () => {
    service = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitController],
      providers: [
        {
          provide: UnitService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<UnitController>(UnitController);
  });

  describe('getUnitDetail', () => {
    it('returns unit with elements ordered by element_num and performance_criteria ordered by pc_num', async () => {
      service.findOne.mockResolvedValue(mockUnit);

      const result = await controller.getUnitDetail('unit-111');

      expect(result).toEqual(mockUnit);
      expect(service.findOne).toHaveBeenCalledWith('unit-111');
      expect(result).toHaveProperty('elements');
      expect(Array.isArray((result as any).elements)).toBe(true);

      // Verify elements have performance_criteria arrays
      const elements = (result as any).elements;
      expect(elements[0]).toHaveProperty('performance_criteria');
      expect(Array.isArray(elements[0].performance_criteria)).toBe(true);

      // Verify ordering is as expected (service is responsible for ordering)
      expect(elements[0].element_num).toBe('1');
      expect(elements[1].element_num).toBe('2');
      expect(elements[0].performance_criteria[0].pc_num).toBe('1.1');
      expect(elements[0].performance_criteria[1].pc_num).toBe('1.2');
    });

    it('returns snapshots sorted by snapshotted_at desc (most recent first)', async () => {
      service.findOne.mockResolvedValue(mockUnit);

      const result = await controller.getUnitDetail('unit-111');

      const snapshots = (result as any).snapshots;
      expect(Array.isArray(snapshots)).toBe(true);
      expect(snapshots).toHaveLength(2);

      // Most recent snapshot is first (desc order)
      expect(snapshots[0].id).toBe('snap-2');
      expect(snapshots[1].id).toBe('snap-1');

      // Each snapshot has the required shape
      expect(snapshots[0]).toHaveProperty('id');
      expect(snapshots[0]).toHaveProperty('snapshotted_at');
      expect(snapshots[0]).toHaveProperty('change_fields');
      expect(snapshots[0]).toHaveProperty('snapshot_data');

      // snapshot_data has the expected nested shape
      const snapData = snapshots[0].snapshot_data as any;
      expect(snapData).toHaveProperty('id');
      expect(snapData).toHaveProperty('code');
      expect(snapData).toHaveProperty('title');
      expect(snapData).toHaveProperty('elements');
      expect(Array.isArray(snapData.elements)).toBe(true);
    });

    it('propagates NotFoundException when service throws for unknown unitId', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Unit not found'),
      );

      await expect(
        controller.getUnitDetail('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);

      await expect(
        controller.getUnitDetail('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('Unit not found');
    });

    it('does not have @Public() decorator — endpoint requires authentication (global AccessTokenGuard)', () => {
      const IS_PUBLIC_KEY = 'isPublic';
      const controllerMeta = Reflect.getMetadata(IS_PUBLIC_KEY, UnitController);
      const handlerMeta = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.getUnitDetail,
      );
      expect(controllerMeta).toBeUndefined();
      expect(handlerMeta).toBeUndefined();
      // TODO: full 401 rejection is tested at e2e level
    });
  });
});
