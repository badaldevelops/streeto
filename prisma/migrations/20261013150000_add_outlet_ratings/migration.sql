CREATE TABLE "OutletRating" (
    "id" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "outletId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "OutletRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutletRating_orderId_key" ON "OutletRating"("orderId");
CREATE INDEX "OutletRating_outletId_createdAt_idx" ON "OutletRating"("outletId", "createdAt");
CREATE INDEX "OutletRating_customerId_createdAt_idx" ON "OutletRating"("customerId", "createdAt");

ALTER TABLE "OutletRating"
ADD CONSTRAINT "OutletRating_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutletRating"
ADD CONSTRAINT "OutletRating_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutletRating"
ADD CONSTRAINT "OutletRating_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
