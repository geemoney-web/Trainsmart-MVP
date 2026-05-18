import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class UsersService {
  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deleted_at: null },
    });
  }

  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        email: true,
        full_name: true,
        created_at: true,
      },
    });
  }
}
