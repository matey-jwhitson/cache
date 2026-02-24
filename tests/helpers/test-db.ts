import { PrismaClient } from "../../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | null = null;

export function getTestDb(): PrismaClient {
  if (!prisma) {
    const connectionString =
      process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "TEST_DATABASE_URL or DATABASE_URL environment variable is not set"
      );
    }
    const adapter = new PrismaPg({ connectionString });
    prisma = new PrismaClient({ adapter });
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
