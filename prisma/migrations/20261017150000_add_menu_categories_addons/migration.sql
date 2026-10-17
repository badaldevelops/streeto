ALTER TABLE "OutletProduct"
  ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other',
  ADD COLUMN "addOns" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "OrderItem"
  ADD COLUMN "addOns" JSONB NOT NULL DEFAULT '[]'::jsonb;