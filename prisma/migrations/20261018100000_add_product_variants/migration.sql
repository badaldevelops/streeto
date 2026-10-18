ALTER TABLE "OutletProduct"
  ADD COLUMN "variants" JSONB NOT NULL DEFAULT '[]'::jsonb;
