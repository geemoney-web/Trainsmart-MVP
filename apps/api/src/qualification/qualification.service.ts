import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class QualificationService {
  async findOne(qualId: string) {
    const qualification = await prisma.qualification.findUnique({
      where: { id: qualId },
      include: {
        units: {
          include: {
            unit: {
              select: {
                id: true,
                code: true,
                title: true,
                status: true,
                superseded_by: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!qualification) {
      throw new NotFoundException('Qualification not found');
    }

    const tasDocuments = await prisma.tasDocument.findMany({
      where: {
        qualification_id: qualId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });

    return { ...qualification, tasDocuments };
  }
}
