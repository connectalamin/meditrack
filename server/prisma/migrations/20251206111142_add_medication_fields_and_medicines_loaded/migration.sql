-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "brandName" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "genericName" TEXT,
ADD COLUMN     "packSizeDescription" TEXT,
ADD COLUMN     "primaryUse" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "medicinesLoaded" BOOLEAN NOT NULL DEFAULT false;
