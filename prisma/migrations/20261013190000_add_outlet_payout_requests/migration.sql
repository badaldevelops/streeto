CREATE TABLE "OutletPayoutRequest" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "utr" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "requestedByUserId" TEXT NOT NULL,
    "paidByUserId" TEXT,
    CONSTRAINT "OutletPayoutRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Payment" ADD COLUMN "outletPayoutRequestId" TEXT;

CREATE INDEX "OutletPayoutRequest_outletId_status_requestedAt_idx"
ON "OutletPayoutRequest"("outletId", "status", "requestedAt");

CREATE INDEX "OutletPayoutRequest_status_requestedAt_idx"
ON "OutletPayoutRequest"("status", "requestedAt");

CREATE INDEX "Payment_outletPayoutRequestId_idx"
ON "Payment"("outletPayoutRequestId");

ALTER TABLE "OutletPayoutRequest"
ADD CONSTRAINT "OutletPayoutRequest_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_outletPayoutRequestId_fkey"
FOREIGN KEY ("outletPayoutRequestId") REFERENCES "OutletPayoutRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
