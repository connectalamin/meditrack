import prisma from '../config/database.js';

export const getMedications = async (req, res, next) => {
  try {
    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { linkedFamilyId: true }
    });

    // Fetch medications from both current user and linked family
    const userIds = [req.user.id];
    if (user?.linkedFamilyId) {
      userIds.push(user.linkedFamilyId);
    }

    // Also check if any other user has linked to the current user (bidirectional)
    const usersLinkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: req.user.id },
      select: { id: true }
    });
    
    usersLinkedToMe.forEach(u => {
      if (!userIds.includes(u.id)) {
        userIds.push(u.id);
      }
    });

    const medications = await prisma.medication.findMany({
      where: { userId: { in: userIds } },
      orderBy: { name: 'asc' }
    });

    res.json({ medications });
  } catch (error) {
    next(error);
  }
};

export const createMedication = async (req, res, next) => {
  try {
    const medication = await prisma.medication.create({
      data: {
        ...req.body,
        userId: req.user.id
      }
    });

    res.status(201).json({ medication });
  } catch (error) {
    next(error);
  }
};

export const updateMedication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const medication = await prisma.medication.update({
      where: {
        id,
        userId: req.user.id
      },
      data: req.body
    });

    res.json({ medication });
  } catch (error) {
    next(error);
  }
};

export const deleteMedication = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First check if the medication exists
    const medication = await prisma.medication.findUnique({
      where: { id }
    });

    if (!medication) {
      // Medication doesn't exist - return success (idempotent delete)
      return res.json({ message: 'Medication deleted successfully' });
    }

    // Check if the medication belongs to the user
    if (medication.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this medication' 
      });
    }

    // Delete the medication
    await prisma.medication.delete({
      where: { id }
    });

    res.json({ message: 'Medication deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Medicine data to load
const medicinesData = [
  {
    "category": "Pain & Fever",
    "brand_name": "Napa",
    "generic_name": "Paracetamol",
    "strength": "500 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 12.00,
    "primary_use": "Fever, mild headache"
  },
  {
    "category": "Pain & Fever",
    "brand_name": "Napa Extra",
    "generic_name": "Paracetamol + Caffeine",
    "strength": "500 mg + 65 mg",
    "pack_size": "Strip of 12 Tablets",
    "price_bdt": 30.00,
    "primary_use": "Severe headache, migraine, body pain"
  },
  {
    "category": "Pain & Fever",
    "brand_name": "Tufnil",
    "generic_name": "Tolfenamic Acid",
    "strength": "200 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 100.00,
    "primary_use": "Acute migraine attack, severe headache"
  },
  {
    "category": "Pain & Fever (External)",
    "brand_name": "Axe Brand Oil",
    "generic_name": "Menthol + Camphor",
    "strength": "N/A",
    "pack_size": "5 ml Bottle",
    "price_bdt": 180.00,
    "primary_use": "Headache rub, cold, insect bite"
  },
  {
    "category": "Gastric & Ulcer",
    "brand_name": "Seclo 20",
    "generic_name": "Omeprazole",
    "strength": "20 mg",
    "pack_size": "Strip of 10 Capsules",
    "price_bdt": 60.00,
    "primary_use": "Acidity, gastric ulcer, heartburn"
  },
  {
    "category": "Gastric & Ulcer",
    "brand_name": "Sergel 20",
    "generic_name": "Esomeprazole",
    "strength": "20 mg",
    "pack_size": "Strip of 10 Capsules",
    "price_bdt": 70.00,
    "primary_use": "Severe acidity, GERD, reflux"
  },
  {
    "category": "Gastric & Ulcer",
    "brand_name": "Dexilend",
    "generic_name": "Dexlansoprazole",
    "strength": "30 mg",
    "pack_size": "Strip of 10 Capsules",
    "price_bdt": 100.00,
    "primary_use": "Healing of Erosive Esophagitis, GERD heartburn"
  },
  {
    "category": "Allergy & Cold",
    "brand_name": "Alcet",
    "generic_name": "Levocetirizine",
    "strength": "5 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 45.00,
    "primary_use": "Allergy, runny nose, itching"
  },
  {
    "category": "Allergy & Cold",
    "brand_name": "Fexo 120",
    "generic_name": "Fexofenadine",
    "strength": "120 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 90.00,
    "primary_use": "Non-drowsy seasonal allergy"
  },
  {
    "category": "Allergy & Cold",
    "brand_name": "Beltas",
    "generic_name": "Bilastine",
    "strength": "20 mg",
    "pack_size": "Strip of 14 Tablets",
    "price_bdt": 210.00,
    "primary_use": "Hay fever, allergic rhinitis (Antihistamine)"
  },
  {
    "category": "Allergy & Cold",
    "brand_name": "Montene",
    "generic_name": "Montelukast",
    "strength": "10 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 175.00,
    "primary_use": "Asthma prevention, allergy symptoms (sneezing)"
  },
  {
    "category": "Respiratory (Asthma/COPD)",
    "brand_name": "Docopa",
    "generic_name": "Doxofylline",
    "strength": "200 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 73.40,
    "primary_use": "Asthma and COPD treatment (Bronchodilator)"
  },
  {
    "category": "Respiratory (Asthma/COPD)",
    "brand_name": "Fylox",
    "generic_name": "Doxofylline",
    "strength": "200 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 74.30,
    "primary_use": "Bronchial asthma, COPD, bronchospasm"
  },
  {
    "category": "Heart & Blood Pressure",
    "brand_name": "Cardizem",
    "generic_name": "Diltiazem",
    "strength": "30 mg",
    "pack_size": "Strip of 14 Tablets",
    "price_bdt": 42.56,
    "primary_use": "Chronic stable angina, hypertension"
  },
  {
    "category": "Heart & Blood Pressure",
    "brand_name": "Bizoran",
    "generic_name": "Amlodipine + Olmesartan Medoxomil",
    "strength": "5 mg + 20 mg",
    "pack_size": "Strip of 15 Tablets",
    "price_bdt": 180.00,
    "primary_use": "Hypertension (high blood pressure) treatment"
  },
  {
    "category": "Diabetes",
    "brand_name": "Amaryl",
    "generic_name": "Glimepiride",
    "strength": "1 mg",
    "pack_size": "Strip of 15 Tablets",
    "price_bdt": 103.80,
    "primary_use": "Type 2 Diabetes Mellitus (blood sugar control)"
  },
  {
    "category": "Diabetes",
    "brand_name": "Sitagil M",
    "generic_name": "Sitagliptin + Metformin",
    "strength": "50 mg + 500 mg (ER)",
    "pack_size": "Strip of 4 Tablets",
    "price_bdt": 64.00,
    "primary_use": "Type 2 Diabetes Mellitus management"
  },
  {
    "category": "Antibiotic & Infection",
    "brand_name": "Cef-3",
    "generic_name": "Cefixime",
    "strength": "200 mg",
    "pack_size": "Strip of 7 Capsules",
    "price_bdt": 315.00,
    "primary_use": "Typhoid, Throat infection, UTI"
  },
  {
    "category": "Antibiotic & Infection",
    "brand_name": "Uritro SR",
    "generic_name": "Nitrofurantoin",
    "strength": "100 mg",
    "pack_size": "Strip of 10 Capsules",
    "price_bdt": 200.00,
    "primary_use": "Urinary Tract Infection (UTI)"
  },
  {
    "category": "Fungal Infection",
    "brand_name": "Candifast SB",
    "generic_name": "Itraconazole",
    "strength": "65 mg",
    "pack_size": "Strip of 10 Capsules",
    "price_bdt": 200.00,
    "primary_use": "Fungal infections (thrush, onychomycosis)"
  },
  {
    "category": "Fungal Infection",
    "brand_name": "Afun",
    "generic_name": "Clotrimazole",
    "strength": "1%",
    "pack_size": "10 gm Tube",
    "price_bdt": 35.00,
    "primary_use": "Topical fungus, ringworm, jock itch"
  },
  {
    "category": "Neurology & Nerve Pain",
    "brand_name": "Gabapen",
    "generic_name": "Gabapentin",
    "strength": "300 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 160.00,
    "primary_use": "Epilepsy seizures, postherpetic neuralgia (nerve pain)"
  },
  {
    "category": "Neurology (Parkinson's)",
    "brand_name": "Finapark",
    "generic_name": "Safinamide",
    "strength": "50 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 250.00,
    "primary_use": "Add-on treatment for Parkinson's disease ('off' episodes)"
  },
  {
    "category": "Neurology (Parkinson's)",
    "brand_name": "Syndopa 110",
    "generic_name": "Levodopa + Carbidopa",
    "strength": "110 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 70.00,
    "primary_use": "Parkinson's disease tremor control"
  },
  {
    "category": "Topical (Hemorrhoids/Bum)",
    "brand_name": "Erian",
    "generic_name": "Cinchocaine + Hydrocortisone",
    "strength": "N/A",
    "pack_size": "15 gm Tube",
    "price_bdt": 85.00,
    "primary_use": "Hemorrhoids (Piles) pain & itching"
  },
  {
    "category": "Topical (Burns & Injury)",
    "brand_name": "Burna",
    "generic_name": "Silver Sulfadiazine",
    "strength": "1%",
    "pack_size": "25 gm Tube",
    "price_bdt": 60.00,
    "primary_use": "Burn wounds (prevents infection)"
  },
  {
    "category": "Liver Care",
    "brand_name": "Ursocol 300",
    "generic_name": "Ursodeoxycholic Acid",
    "strength": "300 mg",
    "pack_size": "Strip of 10 Tablets",
    "price_bdt": 250.00,
    "primary_use": "Liver care (fatty liver, gallstones)"
  },
  {
    "category": "Vitamins & Supplements",
    "brand_name": "Calbo-D",
    "generic_name": "Calcium + Vitamin D3",
    "strength": "500 mg + 200 IU",
    "pack_size": "Container of 30 Tablets",
    "price_bdt": 240.00,
    "primary_use": "Bone strength, back pain"
  }
];

// Helper function to extract unit from pack_size string
function extractUnit(packSizeStr) {
  const lower = packSizeStr.toLowerCase();
  if (lower.includes('tablet')) return 'tablets';
  if (lower.includes('capsule')) return 'capsules';
  if (lower.includes('bottle')) return 'bottles';
  if (lower.includes('tube')) return 'tubes';
  if (lower.includes('drop')) return 'drops';
  if (lower.includes('syrup')) return 'syrup';
  if (lower.includes('ointment')) return 'ointment';
  return 'tablets'; // default
}

// Helper function to extract packSize integer from pack_size string
function extractPackSize(packSizeStr) {
  const match = packSizeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

export const loadMedicines = async (req, res, next) => {
  try {
    // Check if medicines have already been loaded
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { medicinesLoaded: true }
    });

    if (user?.medicinesLoaded) {
      return res.status(400).json({
        message: 'Medicines have already been loaded. Cannot load again.'
      });
    }

    // Map medicines data to database format
    const medicationsToCreate = medicinesData.map(med => {
      const unit = extractUnit(med.pack_size);
      const packSize = extractPackSize(med.pack_size);

      return {
        userId: req.user.id,
        name: med.brand_name,
        category: med.category,
        genericName: med.generic_name,
        brandName: med.brand_name,
        strength: med.strength === 'N/A' ? null : med.strength,
        price: med.price_bdt,
        packSize: packSize,
        packSizeDescription: med.pack_size,
        primaryUse: med.primary_use,
        unit: unit
      };
    });

    // Bulk create medications
    await prisma.medication.createMany({
      data: medicationsToCreate,
      skipDuplicates: true
    });

    // Update user flag
    await prisma.user.update({
      where: { id: req.user.id },
      data: { medicinesLoaded: true }
    });

    res.status(201).json({
      message: `Successfully loaded ${medicationsToCreate.length} medicines`,
      count: medicationsToCreate.length
    });
  } catch (error) {
    next(error);
  }
};

