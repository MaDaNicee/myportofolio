import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

function createPgAdapter(databaseUrl: string) {
  const schema = new URL(databaseUrl).searchParams.get("schema") ?? undefined;

  return new PrismaPg(databaseUrl, schema ? { schema } : undefined);
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL belum diisi. Salin .env.example ke .env lalu isi connection string Neon.",
    );
  }

  return new PrismaClient({ adapter: createPgAdapter(databaseUrl) });
}

export function getPrisma() {
  const globalForPrisma = globalThis as GlobalWithPrisma;

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

function isTransientDatabaseError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const code = "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "P1001" ||
    code === "P1002" ||
    message.includes("timeout") ||
    message.includes("timed out")
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withPrismaRetry<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !isTransientDatabaseError(error)) throw error;

      await wait(250 * attempt);
    }
  }

  throw lastError;
}
