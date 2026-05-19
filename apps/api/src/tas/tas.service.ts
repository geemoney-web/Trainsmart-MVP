import { Injectable } from '@nestjs/common';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@repo/db';
import { CreateTasDto } from './dto/create-tas.dto';
import { PresignTasDto } from './dto/presign-tas.dto';
import { createS3Client, getBucket } from './s3.client';

@Injectable()
export class TasService {
  async generatePresignedUrl(
    dto: PresignTasDto,
  ): Promise<{ presignedUrl: string; fileKey: string }> {
    const sanitized = dto.fileName.replace(/[^A-Za-z0-9._-]/g, '_');
    const fileKey = `tas/${dto.rtoId}/${Date.now()}-${sanitized}`;

    const client = createS3Client();
    const bucket = getBucket();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: dto.contentType,
    });

    const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return { presignedUrl, fileKey };
  }

  async create(dto: CreateTasDto) {
    return prisma.$transaction(async (tx) => {
      if (dto.status === 'Current') {
        await tx.tasDocument.updateMany({
          where: {
            rto_id: dto.rtoId,
            qualification_id: dto.qualificationId,
            status: 'Current',
            deleted_at: null,
          },
          data: { status: 'Archived' },
        });
      }

      const tas = await tx.tasDocument.create({
        data: {
          rto_id: dto.rtoId,
          qualification_id: dto.qualificationId,
          uploaded_by_id: dto.uploadedById ?? null,
          version_label: dto.versionLabel,
          status: dto.status,
          file_key: dto.fileKey,
          file_name: dto.fileName,
          file_size: dto.fileSize,
          review_date: dto.reviewDate ? new Date(dto.reviewDate) : null,
        },
      });

      if (dto.unitIds?.length) {
        await tx.tasDocumentUnit.createMany({
          data: dto.unitIds.map((unit_id) => ({
            tas_document_id: tas.id,
            unit_id,
          })),
        });
      }

      return tas;
    });
  }

  async findByRto(rtoId: string) {
    return prisma.tasDocument.findMany({
      where: { rto_id: rtoId, deleted_at: null },
      include: {
        units: {
          include: {
            unit: { select: { id: true, code: true, title: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
