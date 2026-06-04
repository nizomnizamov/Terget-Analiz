import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma() {
  if (!hasDatabase()) {
    return null;
  }

  globalForPrisma.prisma ??= new PrismaClient();

  return globalForPrisma.prisma;
}
