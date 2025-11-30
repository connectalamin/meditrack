import 'dotenv/config';
// Fixed: Use default import for CommonJS compatibility in ES modules
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Simplified: Standard Prisma Client works fine with NeonDB on Vercel
// No need for PrismaPg adapter - it was causing deployment issues
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

