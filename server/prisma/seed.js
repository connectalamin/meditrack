import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@meditrack.com' },
    update: {},
    create: {
      email: 'demo@meditrack.com',
      password: hashedPassword,
      displayName: 'Demo User',
    },
  });

  console.log('✅ Created user:', user.email);

  // Create device for the user
  const device = await prisma.device.create({
    data: {
      userId: user.id,
      deviceToken: 'demo-device-token-' + Date.now(),
      deviceName: 'Demo Device',
    },
  });

  console.log('✅ Created device');

  // Create medications
  const medications = await Promise.all([
    prisma.medication.create({
      data: {
        userId: user.id,
        name: 'Losartan',
        strength: '50mg',
        price: 120,
        packSize: 15,
        unit: 'tablets',
      },
    }),
    prisma.medication.create({
      data: {
        userId: user.id,
        name: 'Metformin',
        strength: '500mg',
        price: 85,
        packSize: 10,
        unit: 'tablets',
      },
    }),
    prisma.medication.create({
      data: {
        userId: user.id,
        name: 'Napa Extend',
        strength: '665mg',
        price: 30,
        packSize: 12,
        unit: 'tablets',
      },
    }),
  ]);

  console.log('✅ Created', medications.length, 'medications');

  // Create family members
  const familyMembers = await Promise.all([
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Sarah (Mom)',
        relation: 'Mother',
        age: '58',
        lastDoctorVisit: '2023-10-12',
      },
    }),
    prisma.familyMember.create({
      data: {
        userId: user.id,
        name: 'Mike (Dad)',
        relation: 'Father',
        age: '62',
        lastDoctorVisit: '2023-11-05',
      },
    }),
  ]);

  console.log('✅ Created', familyMembers.length, 'family members');

  // Create plans for family members
  await Promise.all([
    prisma.plan.create({
      data: {
        familyMemberId: familyMembers[0].id,
        medicationId: medications[0].id,
        medicationName: 'Losartan',
        dosage: 1,
        frequency: 2,
        price: 120,
        packSize: 15,
      },
    }),
    prisma.plan.create({
      data: {
        familyMemberId: familyMembers[1].id,
        medicationId: medications[1].id,
        medicationName: 'Metformin',
        dosage: 1,
        frequency: 3,
        price: 85,
        packSize: 10,
      },
    }),
  ]);

  console.log('✅ Created medication plans');

  // Create health data for Sarah
  await Promise.all([
    prisma.healthData.create({
      data: {
        familyMemberId: familyMembers[0].id,
        type: 'Blood Pressure',
        value: '120/80',
        unit: 'mmHg',
        date: '2023-10-01',
      },
    }),
    prisma.healthData.create({
      data: {
        familyMemberId: familyMembers[0].id,
        type: 'Blood Pressure',
        value: '125/82',
        unit: 'mmHg',
        date: '2023-10-15',
      },
    }),
    prisma.healthData.create({
      data: {
        familyMemberId: familyMembers[0].id,
        type: 'Glucose',
        value: '95',
        unit: 'mg/dL',
        date: '2023-10-01',
      },
    }),
  ]);

  console.log('✅ Created health data');

  // Create reports
  await prisma.report.create({
    data: {
      userId: user.id,
      title: 'Annual Cardio Checkup',
      date: new Date(),
      type: 'PDF',
      category: 'Report',
      familyMemberId: familyMembers[0].id,
      familyMemberName: 'Sarah (Mom)',
    },
  });

  console.log('✅ Created reports');

  // Create appointments
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);

  await prisma.appointment.create({
    data: {
      userId: user.id,
      doctor: 'Dr. A. Rahim',
      specialty: 'Dentist',
      location: 'Square Hospital',
      date: futureDate.toISOString().slice(0, 10),
      time: '10:30',
      familyMemberId: familyMembers[0].id,
      familyMemberName: 'Sarah (Mom)',
    },
  });

  console.log('✅ Created appointments');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: demo@meditrack.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

