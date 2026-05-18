import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { QualificationController } from '../qualification.controller';
import { QualificationService } from '../qualification.service';

describe('QualificationController', () => {
  let controller: QualificationController;
  let service: { findOne: jest.Mock };

  const mockQualification = {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'BSB50120',
    title: 'Diploma of Business',
    status: 'Current',
    superseded_by: null,
    training_package: 'BSB',
    tga_content_hash: 'abc123',
    last_synced_at: new Date('2025-01-01'),
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
    units: [
      {
        id: 'qu-1',
        qualification_id: '11111111-1111-1111-1111-111111111111',
        unit_id: 'unit-1',
        is_core: true,
        created_at: new Date('2025-01-01'),
        unit: {
          id: 'unit-1',
          code: 'BSBWHS311',
          title: 'Assist with maintaining workplace safety',
          status: 'Current',
          superseded_by: null,
        },
      },
    ],
    tasDocuments: [
      {
        id: 'tas-1',
        rto_id: 'rto-1',
        qualification_id: '11111111-1111-1111-1111-111111111111',
        version_label: 'v1.0',
        status: 'Current',
        file_key: 'files/tas1.pdf',
        file_name: 'TAS_v1.pdf',
        file_size: 1024,
        review_date: null,
        created_at: new Date('2025-03-01'),
        updated_at: new Date('2025-03-01'),
        deleted_at: null,
      },
    ],
  };

  beforeEach(async () => {
    service = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QualificationController],
      providers: [
        {
          provide: QualificationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<QualificationController>(QualificationController);
  });

  describe('getQualificationDetail', () => {
    it('returns qualification with units and tasDocuments on valid qualId', async () => {
      service.findOne.mockResolvedValue(mockQualification);

      const result = await controller.getQualificationDetail(
        '11111111-1111-1111-1111-111111111111',
      );

      expect(result).toEqual(mockQualification);
      expect(service.findOne).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
      );
      expect(result).toHaveProperty('units');
      expect(result).toHaveProperty('tasDocuments');
      expect(Array.isArray((result as any).units)).toBe(true);
      expect(Array.isArray((result as any).tasDocuments)).toBe(true);
    });

    it('propagates NotFoundException when service throws for unknown qualId', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Qualification not found'),
      );

      await expect(
        controller.getQualificationDetail(
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        controller.getQualificationDetail(
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow('Qualification not found');
    });

    it('returns tasDocuments filtered to exclude soft-deleted rows (non-null deleted_at excluded at service level)', async () => {
      // The service filters deleted_at: null in its prisma query.
      // This test verifies the controller returns the service result directly
      // (soft-delete filtering is the service's responsibility).
      const resultWithActiveOnly = {
        ...mockQualification,
        tasDocuments: mockQualification.tasDocuments.filter(
          (d) => d.deleted_at === null,
        ),
      };
      service.findOne.mockResolvedValue(resultWithActiveOnly);

      const result = await controller.getQualificationDetail(
        '11111111-1111-1111-1111-111111111111',
      );

      expect((result as any).tasDocuments).toHaveLength(1);
      expect((result as any).tasDocuments[0].deleted_at).toBeNull();
    });

    it('does not have @Public() decorator — endpoint requires authentication (global AccessTokenGuard)', () => {
      // Assert no @Public() metadata is set on the controller or handler.
      // The global AccessTokenGuard from AuthModule protects all routes by default.
      // @Public() would bypass it — that must NOT be present here.
      const IS_PUBLIC_KEY = 'isPublic'; // matches the key used in @Public() decorator
      const controllerMeta = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        QualificationController,
      );
      const handlerMeta = Reflect.getMetadata(
        IS_PUBLIC_KEY,
        controller.getQualificationDetail,
      );
      expect(controllerMeta).toBeUndefined();
      expect(handlerMeta).toBeUndefined();
      // TODO: full 401 rejection is tested at e2e level (integration test with real JWT guard)
    });
  });
});
