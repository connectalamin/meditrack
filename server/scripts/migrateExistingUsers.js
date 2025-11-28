import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

async function main() {
  console.log('🔄 Starting migration to add self cards for existing users...');

  // Find all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true
    }
  });

  console.log(`📊 Found ${users.length} users to process`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    // Check if user already has a self card
    const existingSelfCard = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        relation: 'Self'
      }
    });

    if (existingSelfCard) {
      console.log(`⏭️  User ${user.email} already has a self card, skipping...`);
      skippedCount++;
      continue;
    }

    // Create self card for user
    await prisma.familyMember.create({
      data: {
        userId: user.id,
        name: user.displayName || user.email.split('@')[0],
        relation: 'Self',
        age: null,
        lastDoctorVisit: null
      }
    });

    console.log(`✅ Created self card for user: ${user.email}`);
    createdCount++;
  }

  console.log('\n🎉 Migration completed successfully!');
  console.log(`📈 Summary:`);
  console.log(`   - Created: ${createdCount} self cards`);
  console.log(`   - Skipped: ${skippedCount} users (already had self cards)`);
  console.log(`   - Total: ${users.length} users processed`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

