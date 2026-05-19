import { TasService } from '../tas.service';

jest.mock('@repo/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    tasDocument: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation((args) => args),
}));

jest.mock('../s3.client', () => ({
  createS3Client: jest.fn().mockReturnValue({}),
  getBucket: jest.fn().mockReturnValue('test-bucket'),
}));

import { prisma } from '@repo/db';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const mockPrisma = prisma as any;

describe('TasService', () => {
  let service: TasService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TasService();
  });

  describe('generatePresignedUrl', () => {
    it('returns presignedUrl and fileKey with correct pattern', async () => {
      const dto = {
        rtoId: 'rto-123',
        fileName: 'test file.pdf',
        fileSize: 1024,
        contentType: 'application/pdf',
      };

      const result = await service.generatePresignedUrl(dto);

      expect(result.presignedUrl).toBe('https://s3.example.com/presigned-url');
      expect(result.fileKey).toMatch(/^tas\/rto-123\/\d+-test_file\.pdf$/);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 },
      );
    });
  });

  describe('create', () => {
    const baseTasRecord = { id: 'tas-456', rto_id: 'rto-123' };

    it('archives prior Current TAS when status is Current', async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const create = jest.fn().mockResolvedValue(baseTasRecord);
      const createMany = jest.fn().mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({ tasDocument: { updateMany, create }, tasDocumentUnit: { createMany } }),
      );

      const dto = {
        rtoId: 'rto-123',
        qualificationId: 'qual-abc',
        versionLabel: 'v2',
        status: 'Current' as const,
        fileKey: 'tas/rto-123/file.pdf',
        fileName: 'file.pdf',
        fileSize: 2048,
      };

      await service.create(dto);

      expect(updateMany).toHaveBeenCalledWith({
        where: {
          rto_id: 'rto-123',
          qualification_id: 'qual-abc',
          status: 'Current',
          deleted_at: null,
        },
        data: { status: 'Archived' },
      });
      expect(create).toHaveBeenCalled();
    });

    it('does NOT archive when status is Draft', async () => {
      const updateMany = jest.fn();
      const create = jest.fn().mockResolvedValue(baseTasRecord);
      const createMany = jest.fn().mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({ tasDocument: { updateMany, create }, tasDocumentUnit: { createMany } }),
      );

      await service.create({
        rtoId: 'rto-123',
        qualificationId: 'qual-abc',
        versionLabel: 'v1',
        status: 'Draft',
        fileKey: 'tas/rto-123/draft.pdf',
        fileName: 'draft.pdf',
        fileSize: 512,
      });

      expect(updateMany).not.toHaveBeenCalled();
    });

    it('creates TAS with all D-13 fields', async () => {
      const create = jest.fn().mockResolvedValue(baseTasRecord);
      const createMany = jest.fn().mockResolvedValue({ count: 0 });

      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({ tasDocument: { updateMany: jest.fn(), create }, tasDocumentUnit: { createMany } }),
      );

      await service.create({
        rtoId: 'rto-123',
        qualificationId: 'qual-abc',
        uploadedById: 'user-xyz',
        versionLabel: 'v1',
        status: 'Draft',
        fileKey: 'tas/rto-123/doc.pdf',
        fileName: 'doc.pdf',
        fileSize: 1024,
        reviewDate: '2026-06-01',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rto_id: 'rto-123',
            qualification_id: 'qual-abc',
            uploaded_by_id: 'user-xyz',
            version_label: 'v1',
            status: 'Draft',
            file_key: 'tas/rto-123/doc.pdf',
            file_name: 'doc.pdf',
            file_size: 1024,
          }),
        }),
      );
    });

    it('creates junction rows when unitIds provided', async () => {
      const create = jest.fn().mockResolvedValue({ id: 'tas-789' });
      const createMany = jest.fn().mockResolvedValue({ count: 2 });

      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({ tasDocument: { updateMany: jest.fn(), create }, tasDocumentUnit: { createMany } }),
      );

      await service.create({
        rtoId: 'rto-123',
        qualificationId: 'qual-abc',
        versionLabel: 'v1',
        status: 'Draft',
        fileKey: 'k',
        fileName: 'f.pdf',
        fileSize: 100,
        unitIds: ['unit-1', 'unit-2'],
      });

      expect(createMany).toHaveBeenCalledWith({
        data: [
          { tas_document_id: 'tas-789', unit_id: 'unit-1' },
          { tas_document_id: 'tas-789', unit_id: 'unit-2' },
        ],
      });
    });

    it('has no hard-delete code path', () => {
      const src = require('fs').readFileSync(
        require('path').join(__dirname, '../tas.service.ts'),
        'utf8',
      );
      expect(src).not.toMatch(/tasDocument\.(delete|deleteMany)\b/);
    });
  });

  describe('findByRto', () => {
    it('returns tasDocuments filtered by rto_id and deleted_at: null ordered by created_at desc', async () => {
      const rows = [{ id: 'tas-1' }];
      mockPrisma.tasDocument.findMany.mockResolvedValue(rows);

      const result = await service.findByRto('rto-abc');

      expect(mockPrisma.tasDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rto_id: 'rto-abc', deleted_at: null },
          orderBy: { created_at: 'desc' },
        }),
      );
      expect(result).toBe(rows);
    });
  });
});
