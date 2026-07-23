import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '1234567890' },
    update: {},
    create: {
      phoneNumber: '1234567890',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log({ admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
