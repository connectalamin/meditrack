import 'dotenv/config';
// Fixed: Use default import for CommonJS compatibility in ES modules
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Create a PostgreSQL connection pool for NeonDB
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter for NeonDB compatibility
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

