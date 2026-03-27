import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import prismaClientPkg from '@prisma/client';

const { PrismaClient } = prismaClientPkg;

const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma = new PrismaClient({ adapter });
