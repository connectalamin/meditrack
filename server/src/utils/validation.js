import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Appointment schemas
export const appointmentSchema = z.object({
  doctor: z.string().min(1, 'Doctor name is required'),
  specialty: z.string().optional(),
  location: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().optional(),
  familyMemberId: z.string().optional(),
  familyMemberName: z.string().optional(),
});

export const updateAppointmentSchema = appointmentSchema.partial();

// Family member schemas
export const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relation: z.string().optional(),
  age: z.string().optional(),
  lastDoctorVisit: z.string().optional(),
});

export const updateFamilyMemberSchema = familyMemberSchema.partial();

// Medication schemas
export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  category: z.string().optional(),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  strength: z.string().optional(),
  price: z.number().min(0).optional(),
  packSize: z.number().min(1).optional(),
  packSizeDescription: z.string().optional(),
  primaryUse: z.string().optional(),
  unit: z.string().optional(),
});

export const updateMedicationSchema = medicationSchema.partial();

// Report schemas
export const reportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.union([z.string().datetime(), z.date()]).optional(),
  type: z.enum(['PDF', 'Scanned Image']).optional(),
  category: z.enum(['Report', 'Prescription']).optional(),
  fileUrl: z.string().optional(),
  familyMemberId: z.string().nullable().optional(),
  familyMemberName: z.string().optional(),
});

export const updateReportSchema = reportSchema.partial();

// Health data schemas
export const healthDataSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  value: z.string().min(1, 'Value is required'),
  unit: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional()
  ),
});

export const updateHealthDataSchema = healthDataSchema.partial();

// Plan schemas
export const planSchema = z.object({
  medicationId: z.string().min(1, 'Medication ID is required'),
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.number().min(0.1, 'Dosage must be at least 0.1'),
  frequency: z.number().min(1),
  price: z.number().min(0),
  packSize: z.number().min(1),
});

export const updatePlanSchema = planSchema.partial();

// Purchase list item schemas
export const purchaseListItemSchema = z.object({
  medicationId: z.string().optional(),
  medicationName: z.string().min(1, 'Medication name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  discount: z.number().min(0).max(100).optional(),
});

export const updatePurchaseListItemSchema = purchaseListItemSchema.partial();

// Purchase list log schemas
export const purchaseListLogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  totalItems: z.number().min(0),
  totalQuantity: z.number().min(0),
  totalCost: z.number().min(0),
  discount: z.number().min(0).max(100).optional(),
});


