-- CreateTable
CREATE TABLE "purchase_list_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_list_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_list_logs" ADD CONSTRAINT "purchase_list_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
