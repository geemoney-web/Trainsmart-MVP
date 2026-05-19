import { Test, TestingModule } from '@nestjs/testing';
import { TasController } from '../tas.controller';
import { TasService } from '../tas.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTasDto } from '../dto/create-tas.dto';
import { PresignTasDto } from '../dto/presign-tas.dto';

const mockTasService = {
  generatePresignedUrl: jest.fn(),
  create: jest.fn(),
  findByRto: jest.fn(),
};

describe('TasController', () => {
  let controller: TasController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasController],
      providers: [{ provide: TasService, useValue: mockTasService }],
    }).compile();
    controller = module.get<TasController>(TasController);
  });

  it('presign delegates to service.generatePresignedUrl', async () => {
    const dto = {
      rtoId: 'rto-123',
      fileName: 'test.pdf',
      fileSize: 1024,
      contentType: 'application/pdf',
    } as PresignTasDto;
    const expected = { presignedUrl: 'https://s3.example.com/url', fileKey: 'tas/rto-123/ts-test.pdf' };
    mockTasService.generatePresignedUrl.mockResolvedValue(expected);

    const result = await controller.presign(dto);

    expect(mockTasService.generatePresignedUrl).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it('createTas delegates to service.create', async () => {
    const dto = {
      rtoId: 'rto-123',
      qualificationId: 'qual-abc',
      versionLabel: 'v1',
      status: 'Draft' as const,
      fileKey: 'k',
      fileName: 'f.pdf',
      fileSize: 512,
    } as CreateTasDto;
    const created = { id: 'tas-1' };
    mockTasService.create.mockResolvedValue(created);

    const result = await controller.createTas(dto);

    expect(mockTasService.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(created);
  });

  it('getTasByRto delegates to service.findByRto', async () => {
    const rows = [{ id: 'tas-1' }];
    mockTasService.findByRto.mockResolvedValue(rows);

    const result = await controller.getTasByRto('rto-abc');

    expect(mockTasService.findByRto).toHaveBeenCalledWith('rto-abc');
    expect(result).toBe(rows);
  });

  it('CreateTasDto rejects invalid status values', async () => {
    const dto = plainToInstance(CreateTasDto, {
      rtoId: '00000000-0000-0000-0000-000000000001',
      qualificationId: '00000000-0000-0000-0000-000000000002',
      versionLabel: 'v1',
      status: 'Published',
      fileKey: 'k',
      fileName: 'f.pdf',
      fileSize: 100,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('PresignTasDto rejects invalid contentType', async () => {
    const dto = plainToInstance(PresignTasDto, {
      rtoId: '00000000-0000-0000-0000-000000000001',
      fileName: 'file.exe',
      fileSize: 100,
      contentType: 'application/x-executable',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'contentType')).toBe(true);
  });
});
