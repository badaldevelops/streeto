ALTER TABLE "Payment" ADD COLUMN "outletPayoutStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Payment" ADD COLUMN "outletPayoutReference" TEXT;
ALTER TABLE "Payment" ADD COLUMN "outletPayoutAt" TIMESTAMP(3);
