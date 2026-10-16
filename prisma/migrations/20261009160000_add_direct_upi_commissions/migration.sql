ALTER TABLE "Company" ADD COLUMN "upiId" TEXT;
ALTER TABLE "Order" ADD COLUMN "platformCommission" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "upiReference" TEXT;
ALTER TABLE "Payment" ADD COLUMN "upiPayeeId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "upiPayeeName" TEXT;

CREATE TABLE "CommissionCollection" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommissionCollection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommissionCollection_companyId_collectedAt_idx"
ON "CommissionCollection"("companyId", "collectedAt");

ALTER TABLE "CommissionCollection"
ADD CONSTRAINT "CommissionCollection_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
