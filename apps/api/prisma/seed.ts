// DO NOT use this credential in production — placeholder for local dev only
import { prisma } from '@repo/db';
import * as bcrypt from 'bcryptjs';

async function main() {
  const email = 'operator@trainsmart.local';
  const password = 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password_hash: hash, full_name: 'Operator' },
  });

  console.log('Seeded user: operator@trainsmart.local / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
