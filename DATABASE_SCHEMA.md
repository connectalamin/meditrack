# MediTrack Database Schema Documentation

This document describes the complete database schema for the MediTrack application. This schema can be used to generate Entity-Relationship (ER) diagrams.

## Database Information

- **Database Type**: PostgreSQL
- **ORM**: Prisma
- **Total Entities**: 9

---

## Entity Definitions

### 1. User

**Table Name**: `users`

**Description**: Central entity representing application users. Supports both email/password and Google OAuth authentication. Users can link to family dashboards.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `email` (String, Unique, Required) - User email address
- `password` (String, Optional) - Hashed password (null for OAuth users)
- `displayName` (String, Optional) - User's display name
- `googleId` (String, Unique, Optional) - Google OAuth identifier
- `linkedFamilyId` (String, Optional) - ID of linked family dashboard
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- One-to-Many with `Device` (Cascade Delete)
- One-to-Many with `Appointment` (Cascade Delete)
- One-to-Many with `FamilyMember` (Cascade Delete)
- One-to-Many with `Medication` (Cascade Delete)
- One-to-Many with `Report` (Cascade Delete)
- One-to-Many with `PurchaseListItem` (Cascade Delete)
- One-to-Many with `PurchaseListLog` (Cascade Delete)

**Constraints**:
- `email` is UNIQUE
- `googleId` is UNIQUE (when present)

---

### 2. Device

**Table Name**: `devices`

**Description**: Tracks user devices for push notifications and multi-device support.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `deviceToken` (String, Unique, Required) - Unique device token for push notifications
- `deviceName` (String, Required) - Name/identifier of the device
- `lastActive` (DateTime, Required, Auto) - Last activity timestamp
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)

**Constraints**:
- `deviceToken` is UNIQUE

---

### 3. Appointment

**Table Name**: `appointments`

**Description**: Medical appointments scheduled by users, can be associated with family members.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `doctor` (String, Required) - Doctor's name
- `specialty` (String, Optional) - Medical specialty
- `location` (String, Optional) - Appointment location
- `date` (String, Required) - Appointment date
- `time` (String, Optional) - Appointment time
- `familyMemberId` (String, Optional) - Associated family member ID (denormalized)
- `familyMemberName` (String, Optional) - Associated family member name (denormalized)
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)

**Notes**:
- `familyMemberId` and `familyMemberName` are denormalized fields for quick access

---

### 4. FamilyMember

**Table Name**: `family_members`

**Description**: Family members associated with a user. Each family member can have health data and medication plans.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `name` (String, Required) - Family member's name
- `relation` (String, Optional) - Relationship to user (e.g., "Father", "Mother", "Child")
- `age` (String, Optional) - Family member's age
- `lastDoctorVisit` (String, Optional) - Date of last doctor visit
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)
- One-to-Many with `HealthData` (Cascade Delete)
- One-to-Many with `Plan` (Cascade Delete)

---

### 5. Medication

**Table Name**: `medications`

**Description**: Global medication database shared by users. Contains medication information including pricing and packaging.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `name` (String, Required) - Medication name
- `strength` (String, Optional) - Medication strength/dosage
- `price` (Float, Required, Default: 0) - Price per pack
- `packSize` (Integer, Required, Default: 1) - Number of units per pack
- `unit` (String, Required, Default: "tablets") - Unit of measurement
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)
- One-to-Many with `PurchaseListItem` (Set Null on Delete)

**Notes**:
- Medications are user-specific but can be shared within linked families

---

### 6. Report

**Table Name**: `reports`

**Description**: Medical reports and documents uploaded by users. Can be associated with family members.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `title` (String, Required) - Report title
- `date` (DateTime, Required, Auto) - Report date
- `type` (String, Required, Default: "PDF") - File type (PDF, Image, etc.)
- `category` (String, Required, Default: "Report") - Category (Report, Prescription, etc.)
- `fileUrl` (String, Optional) - URL to stored file
- `familyMemberId` (String, Optional) - Associated family member ID (denormalized)
- `familyMemberName` (String, Optional) - Associated family member name (denormalized)
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)

**Notes**:
- `familyMemberId` and `familyMemberName` are denormalized for quick access

---

### 7. HealthData

**Table Name**: `health_data`

**Description**: Health measurements and vitals recorded for family members (e.g., blood pressure, glucose, hemoglobin).

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `familyMemberId` (String, Foreign Key, Required) - References FamilyMember.id
- `type` (String, Required) - Type of health data (e.g., "Blood Pressure", "Glucose", "Hemoglobin")
- `value` (String, Required) - Measurement value
- `unit` (String, Optional) - Unit of measurement (e.g., "mmHg", "mmol/L", "g/dL")
- `date` (String, Required) - Date of measurement (YYYY-MM-DD format)
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp

**Relationships**:
- Many-to-One with `FamilyMember` (Foreign Key: familyMemberId, Cascade Delete)

**Notes**:
- Supports multiple health metric types with unit conversion capabilities
- Common types: Blood Pressure, Glucose, Hemoglobin

---

### 8. Plan

**Table Name**: `plans`

**Description**: Medication plans for family members, specifying dosage, frequency, and cost calculations.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `familyMemberId` (String, Foreign Key, Required) - References FamilyMember.id
- `medicationId` (String, Required) - Medication identifier (denormalized)
- `medicationName` (String, Required) - Medication name (denormalized)
- `dosage` (Integer, Required) - Dosage per administration
- `frequency` (Integer, Required) - Frequency per day
- `price` (Float, Required) - Price per pack (denormalized)
- `packSize` (Integer, Required) - Pack size (denormalized)
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- Many-to-One with `FamilyMember` (Foreign Key: familyMemberId, Cascade Delete)

**Notes**:
- Medication details are denormalized for performance and historical accuracy
- Used to calculate monthly medication needs and costs

---

### 9. PurchaseListItem

**Table Name**: `purchase_list_items`

**Description**: Items in the purchase list for buying medications. Can be linked to medications in the database.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `medicationId` (String, Foreign Key, Optional) - References Medication.id
- `medicationName` (String, Required) - Medication name
- `quantity` (Integer, Required) - Quantity to purchase
- `price` (Float, Required) - Price per unit
- `totalCost` (Float, Required) - Total cost (quantity × price)
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp
- `updatedAt` (DateTime, Required, Auto) - Record update timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)
- Many-to-One with `Medication` (Foreign Key: medicationId, Set Null on Delete)

**Notes**:
- `medicationId` is optional to allow custom medications not in the database
- Set Null on delete preserves purchase history if medication is deleted

---

### 10. PurchaseListLog

**Table Name**: `purchase_list_logs`

**Description**: Historical logs of completed purchase lists, storing summary information.

**Attributes**:
- `id` (String, Primary Key, CUID) - Unique identifier
- `userId` (String, Foreign Key, Required) - References User.id
- `title` (String, Required) - Log title
- `content` (String, Required) - Detailed content/description
- `totalItems` (Integer, Required) - Total number of items
- `totalQuantity` (Integer, Required) - Total quantity purchased
- `totalCost` (Float, Required) - Total cost
- `createdAt` (DateTime, Required, Auto) - Record creation timestamp

**Relationships**:
- Many-to-One with `User` (Foreign Key: userId, Cascade Delete)

**Notes**:
- Used for tracking purchase history and generating reports

---

## Relationship Summary

### One-to-Many Relationships

1. **User → Device** (1:N, Cascade Delete)
2. **User → Appointment** (1:N, Cascade Delete)
3. **User → FamilyMember** (1:N, Cascade Delete)
4. **User → Medication** (1:N, Cascade Delete)
5. **User → Report** (1:N, Cascade Delete)
6. **User → PurchaseListItem** (1:N, Cascade Delete)
7. **User → PurchaseListLog** (1:N, Cascade Delete)
8. **FamilyMember → HealthData** (1:N, Cascade Delete)
9. **FamilyMember → Plan** (1:N, Cascade Delete)
10. **Medication → PurchaseListItem** (1:N, Set Null on Delete)

### No Direct Many-to-Many Relationships

All relationships in this schema are one-to-many or many-to-one.

---

## Key Design Patterns

### 1. Denormalization
- `Appointment.familyMemberId` and `familyMemberName` - Denormalized for quick access
- `Report.familyMemberId` and `familyMemberName` - Denormalized for quick access
- `Plan.medicationId`, `medicationName`, `price`, `packSize` - Denormalized for historical accuracy

### 2. Cascade Deletes
- Most relationships use cascade delete to maintain referential integrity
- Exception: `Medication → PurchaseListItem` uses Set Null to preserve purchase history

### 3. Optional Foreign Keys
- `PurchaseListItem.medicationId` is optional to support custom medications
- `Appointment.familyMemberId` is optional (appointments can be user-level)

### 4. Timestamps
- All entities have `createdAt` timestamp
- Most entities have `updatedAt` timestamp (except HealthData and PurchaseListLog)

---

## Indexes and Constraints

### Unique Constraints
- `User.email` - UNIQUE
- `User.googleId` - UNIQUE (when present)
- `Device.deviceToken` - UNIQUE

### Foreign Key Constraints
- All foreign keys are properly indexed by Prisma
- Cascade delete is used for most relationships
- Set Null is used for `PurchaseListItem.medicationId`

---

## ER Diagram Generation Notes

When generating an ER diagram from this schema:

1. **Entities**: Create rectangles for all 10 entities listed above
2. **Attributes**: List all attributes within each entity rectangle
3. **Primary Keys**: Underline primary key attributes
4. **Foreign Keys**: Mark foreign key attributes with (FK)
5. **Relationships**: 
   - Use diamond shapes for relationships
   - Label relationships clearly
   - Use "1" and "N" or "1" and "*" to indicate cardinality
   - Show cascade delete with "CASCADE" notation
   - Show set null with "SET NULL" notation
6. **Optional Attributes**: Mark optional attributes with "(O)" or use dashed lines
7. **Unique Constraints**: Mark unique attributes with "UNIQUE"

### Suggested Layout
- Place `User` in the center as the main entity
- Group related entities:
  - **User Management**: User, Device
  - **Family & Health**: User, FamilyMember, HealthData, Plan
  - **Medications**: User, Medication, Plan, PurchaseListItem
  - **Documents**: User, Report, Appointment
  - **History**: User, PurchaseListLog

---

## Data Types Reference

- **String**: Variable-length text (CUID for IDs, text for names, etc.)
- **Integer**: Whole numbers (quantities, frequencies, etc.)
- **Float**: Decimal numbers (prices, costs, etc.)
- **DateTime**: Timestamp with date and time
- **Boolean**: Not used in this schema (all flags are strings or optional fields)

---

## Additional Notes

1. **CUID**: All primary keys use CUID (Collision-resistant Unique Identifier) format
2. **Soft Deletes**: Not implemented - all deletes are hard deletes
3. **Audit Trail**: Limited - only createdAt/updatedAt timestamps
4. **Multi-tenancy**: User-based isolation - all data is scoped to users
5. **Family Linking**: Users can link to other users via `linkedFamilyId` for shared family dashboards
6. **File Storage**: Reports store file URLs (actual files stored externally)

---

*Last Updated: Based on Prisma schema as of implementation date*
*Schema Version: 1.0*

