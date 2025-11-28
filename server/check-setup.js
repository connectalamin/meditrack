import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

async function checkSetup() {
  console.log('🔍 Checking server setup...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('  PORT:', process.env.PORT || '5000 (default)');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  CLIENT_URL:', process.env.CLIENT_URL || 'not set');
  console.log('  BCRYPT_ROUNDS:', process.env.BCRYPT_ROUNDS || '10 (default)');
  console.log('');

  // Check Prisma Client
  try {
    console.log('🔌 Testing Prisma Client...');
    const prisma = new PrismaClient();
    
    // Try to connect
    await prisma.$connect();
    console.log('  ✅ Prisma Client connected');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`  ✅ Database accessible (${userCount} users found)`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('  ❌ Prisma Client error:', error.message);
    if (error.code === 'P1001') {
      console.error('  💡 Database connection failed. Check DATABASE_URL in .env');
    } else if (error.code === 'P1000') {
      console.error('  💡 Authentication failed. Check database credentials.');
    } else {
      console.error('  💡 Run: npm run prisma:generate');
    }
  }

  console.log('\n✅ Setup check complete');
}

checkSetup().catch(console.error);

