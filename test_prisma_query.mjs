import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        role: true,
        creditPoints: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: { scans: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log("Success:", users.length);
  } catch (err) {
    console.error("Prisma error:", err);
  }
}
main();
