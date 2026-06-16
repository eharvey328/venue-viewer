import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  // Prisma v7 type requires adapter/accelerateUrl but reads DATABASE_URL at runtime
  (new (PrismaClient as any)({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }) as PrismaClient)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
