-- CreateTable
CREATE TABLE "purchase_list_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicationId" TEXT,
    "medicationName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_list_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_list_items" ADD CONSTRAINT "purchase_list_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_list_items" ADD CONSTRAINT "purchase_list_items_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
