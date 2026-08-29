import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Enable SQLite Write-Ahead Logging (WAL) and memory caching for ultra-low latency
if (!globalForPrisma.prisma) {
  db.$queryRawUnsafe(
    "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA cache_size = 10000; PRAGMA temp_store = MEMORY;"
  ).catch(() => {});
}
