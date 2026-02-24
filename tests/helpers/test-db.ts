import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function getTestDb(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    });
  }
  return prisma;
}

export async function resetTestDb(): Promise<void> {
  const db = getTestDb();
  const tablenames = await db.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

  if (tables.length > 0) {
    await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
}

export async function disconnectTestDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
