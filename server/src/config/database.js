import 'dotenv/config';
// Fixed: Use default import for CommonJS compatibility in ES modules
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Create a PostgreSQL connection pool for NeonDB
let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Remove channel_binding=require if present (not supported by Neon)
// Neon requires sslmode=require but channel_binding can cause connection issues
if (connectionString.includes('channel_binding=require')) {
  connectionString = connectionString.replace(/[&?]channel_binding=require/g, '');
  // Clean up any double ampersands or question marks
  connectionString = connectionString.replace(/[&]{2,}/g, '&').replace(/\?&/g, '?');
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

