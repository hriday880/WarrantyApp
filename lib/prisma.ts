import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web'

const urlValue = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const finalUrl = (urlValue && urlValue !== 'undefined' && urlValue !== 'null') ? urlValue : "libsql://warranty-app-hriday880.aws-ap-northeast-1.turso.io";

const tokenValue = process.env.TURSO_AUTH_TOKEN;
const finalToken = (tokenValue && tokenValue !== 'undefined' && tokenValue !== 'null') ? tokenValue : "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODQ3OTQ1MjAsImlkIjoiMDE5ZjhlMGEtNmIwMS03YzVhLTgxOGMtZWQ5NzUyZjg0Y2UwIiwia2lkIjoidGFQQ2JOZ0Y1RXp1UEQtUTBFUnYwOVVWamZZa25zczdaTW9SSUo0S1ZsRSIsInJpZCI6Ijg3NGNjMzQzLTcyNGQtNGUxNS1iZTg0LWYzNDkzNmY2MTMwMSJ9.SeY8zx3-0zQKt-3EHwl6pzeOpV7Bc2Tpcg_KoqlE9wp0SjXzN9Q-q_Q1AW86sOOxMf1ANHz9rJ0T8AYMm3RkCg";

const libsql = createClient({
  url: finalUrl,
  authToken: finalToken,
})

const adapter = new PrismaLibSql(libsql)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
  adapter,
  datasourceUrl: finalUrl
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
