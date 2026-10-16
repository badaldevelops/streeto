ALTER TABLE "Payment" ADD COLUMN "gatewayOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewaySessionId" TEXT;
CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");
ALTER TABLE "Outlet" ADD COLUMN "cashfreeVendorId" TEXT;
ALTER TABLE "Outlet" ADD COLUMN "cashfreeVendorStatus" TEXT;
ALTER TABLE "Outlet" ADD COLUMN "cashfreeVendorLast4" TEXT;
ALTER TABLE "Outlet" ADD COLUMN "cashfreeVendorIfsc" TEXT;
CREATE UNIQUE INDEX "Outlet_cashfreeVendorId_key" ON "Outlet"("cashfreeVendorId");
