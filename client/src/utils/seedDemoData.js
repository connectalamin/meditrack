
// Seed demo data utility - uses real API calls via AppContext helpers.
// This populates medications, family members, plans, health data,
// reports and appointments so the dashboard looks “full”.

export const seedDemoData = async (appContext) => {
  const {
    user,
    addMedication,
    addFamilyMember,
    addPlan,
    addReport,
    addHealthData,
    addAppointment,
  } = appContext;

  if (!user) {
    throw new Error('You must be logged in to seed demo data. Please log in and try again.');
  }

  try {
    // 1. Global medication database (8+ meds)
    const meds = await Promise.all([
      addMedication({ name: 'Losartan', strength: '50mg', price: 120, packSize: 15, unit: 'tablets' }),
      addMedication({ name: 'Metformin', strength: '500mg', price: 85, packSize: 10, unit: 'tablets' }),
      addMedication({ name: 'Napa Extend', strength: '665mg', price: 30, packSize: 12, unit: 'tablets' }),
      addMedication({ name: 'Atorvastatin', strength: '20mg', price: 140, packSize: 10, unit: 'tablets' }),
      addMedication({ name: 'Omeprazole', strength: '20mg', price: 70, packSize: 14, unit: 'capsules' }),
      addMedication({ name: 'Bisoprolol', strength: '5mg', price: 95, packSize: 14, unit: 'tablets' }),
      addMedication({ name: 'Insulin (Glargine)', strength: '100 IU/mL', price: 950, packSize: 1, unit: 'vial' }),
      addMedication({ name: 'Vitamin D3', strength: '2000 IU', price: 60, packSize: 30, unit: 'capsules' }),
    ]);

    const [
      losartan,
      metformin,
      napaExtend,
      atorvastatin,
      omeprazole,
      bisoprolol,
      insulin,
      vitaminD,
    ] = meds;

    // 2. Family members (4 people)
    const [sarah, mike, emma, grandpa] = await Promise.all([
      addFamilyMember({ name: 'Sarah (Mom)', relation: 'Mother', age: '58', lastDoctorVisit: '2024-01-12' }),
      addFamilyMember({ name: 'Mike (Dad)', relation: 'Father', age: '62', lastDoctorVisit: '2024-02-05' }),
      addFamilyMember({ name: 'Emma', relation: 'Daughter', age: '14', lastDoctorVisit: '2024-03-20' }),
      addFamilyMember({ name: 'Grandpa Joe', relation: 'Grandfather', age: '78', lastDoctorVisit: '2023-12-02' }),
    ]);

    // 3. Monthly medication plans
    // Sarah – hypertension + cholesterol
    await addPlan(sarah.id, {
      medicationId: losartan.id,
      medicationName: losartan.name,
      dosage: 1,
      frequency: 2,
      price: losartan.price,
      packSize: losartan.packSize,
    });
    await addPlan(sarah.id, {
      medicationId: atorvastatin.id,
      medicationName: atorvastatin.name,
      dosage: 1,
      frequency: 1,
      price: atorvastatin.price,
      packSize: atorvastatin.packSize,
    });

    // Mike – diabetes + BP
    await addPlan(mike.id, {
      medicationId: metformin.id,
      medicationName: metformin.name,
      dosage: 1,
      frequency: 3,
      price: metformin.price,
      packSize: metformin.packSize,
    });
    await addPlan(mike.id, {
      medicationId: bisoprolol.id,
      medicationName: bisoprolol.name,
      dosage: 1,
      frequency: 1,
      price: bisoprolol.price,
      packSize: bisoprolol.packSize,
    });

    // Grandpa – insulin + vitamin D
    await addPlan(grandpa.id, {
      medicationId: insulin.id,
      medicationName: insulin.name,
      dosage: 20,
      frequency: 1,
      price: insulin.price,
      packSize: insulin.packSize,
    });
    await addPlan(grandpa.id, {
      medicationId: vitaminD.id,
      medicationName: vitaminD.name,
      dosage: 1,
      frequency: 1,
      price: vitaminD.price,
      packSize: vitaminD.packSize,
    });

    // Emma – occasional omeprazole as needed
    await addPlan(emma.id, {
      medicationId: omeprazole.id,
      medicationName: omeprazole.name,
      dosage: 1,
      frequency: 1,
      price: omeprazole.price,
      packSize: omeprazole.packSize,
    });

    // 4. Health data history (BP, glucose, weight)
    const today = new Date();
    // For healthData (schema stores date as string)
    const daysAgo = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    };
    // For reports (Prisma expects full ISO-8601 DateTime)
    const daysAgoISO = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return d.toISOString();
    };

    // Sarah – blood pressure + glucose
    await Promise.all([
      addHealthData(sarah.id, { type: 'Blood Pressure', value: '118/76', unit: 'mmHg', date: daysAgo(28) }),
      addHealthData(sarah.id, { type: 'Blood Pressure', value: '122/80', unit: 'mmHg', date: daysAgo(21) }),
      addHealthData(sarah.id, { type: 'Blood Pressure', value: '124/82', unit: 'mmHg', date: daysAgo(14) }),
      addHealthData(sarah.id, { type: 'Glucose (Fasting)', value: '96', unit: 'mg/dL', date: daysAgo(27) }),
      addHealthData(sarah.id, { type: 'Glucose (Random)', value: '132', unit: 'mg/dL', date: daysAgo(13) }),
    ]);

    // Mike – glucose + weight
    await Promise.all([
      addHealthData(mike.id, { type: 'Glucose (Fasting)', value: '118', unit: 'mg/dL', date: daysAgo(30) }),
      addHealthData(mike.id, { type: 'Glucose (Fasting)', value: '110', unit: 'mg/dL', date: daysAgo(15) }),
      addHealthData(mike.id, { type: 'Glucose (Random)', value: '168', unit: 'mg/dL', date: daysAgo(7) }),
      addHealthData(mike.id, { type: 'Weight', value: '82', unit: 'kg', date: daysAgo(30) }),
      addHealthData(mike.id, { type: 'Weight', value: '81.5', unit: 'kg', date: daysAgo(3) }),
    ]);

    // Grandpa – BP only
    await Promise.all([
      addHealthData(grandpa.id, { type: 'Blood Pressure', value: '132/84', unit: 'mmHg', date: daysAgo(25) }),
      addHealthData(grandpa.id, { type: 'Blood Pressure', value: '138/86', unit: 'mmHg', date: daysAgo(10) }),
    ]);

    // 5. Reports & documents
    await Promise.all([
      addReport({
        title: 'Sarah - Cardiology Follow-up',
        date: daysAgoISO(20),
        type: 'PDF',
        category: 'Report',
        familyMemberId: sarah.id,
        familyMemberName: sarah.name,
      }),
      addReport({
        title: 'Mike - Diabetes Review',
        date: daysAgoISO(18),
        type: 'PDF',
        category: 'Report',
        familyMemberId: mike.id,
        familyMemberName: mike.name,
      }),
      addReport({
        title: 'Emma - School Physical',
        date: daysAgoISO(40),
        type: 'PDF',
        category: 'Report',
        familyMemberId: emma.id,
        familyMemberName: emma.name,
      }),
      addReport({
        title: 'Family Vaccination Records',
        date: daysAgoISO(60),
        type: 'PDF',
        category: 'Prescription',
        familyMemberId: null,
        familyMemberName: 'General',
      }),
    ]);

    // 6. Upcoming + past appointments
    const mkDate = (offsetDays) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().slice(0, 10);
    };

    await Promise.all([
      addAppointment({
        doctor: 'Dr. A. Rahim',
        specialty: 'Dentist',
        location: 'Square Hospital',
        date: mkDate(2),
        time: '10:30',
        familyMemberName: sarah.name,
        familyMemberId: sarah.id,
      }),
      addAppointment({
        doctor: 'Dr. N. Chowdhury',
        specialty: 'Endocrinologist',
        location: 'City Medical Center',
        date: mkDate(5),
        time: '09:00',
        familyMemberName: mike.name,
        familyMemberId: mike.id,
      }),
      addAppointment({
        doctor: 'Dr. T. Hasan',
        specialty: 'Pediatrician',
        location: 'Green Valley Clinic',
        date: mkDate(-10),
        time: '16:15',
        familyMemberName: emma.name,
        familyMemberId: emma.id,
      }),
      addAppointment({
        doctor: 'Dr. K. Rahman',
        specialty: 'Geriatrician',
        location: 'National Hospital',
        date: mkDate(14),
        time: '11:45',
        familyMemberName: grandpa.name,
        familyMemberId: grandpa.id,
      }),
    ]);

    // Reload to show new data everywhere
    window.location.reload();
  } catch (error) {
    console.error('Error seeding demo data:', error);
    // Don't reload if there was an error
    throw error; // Re-throw so the caller can handle it
  }
};
