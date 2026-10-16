CREATE TYPE "BusinessVerificationStatus" AS ENUM ('PENDING', 'APPROVED');

ALTER TABLE "Company"
ADD COLUMN "verificationStatus" "BusinessVerificationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "foodLicenseNumber" TEXT,
ADD COLUMN "foodLicenseExpiry" TIMESTAMP(3),
ADD COLUMN "ownerAadhaarCiphertext" TEXT,
ADD COLUMN "ownerAadhaarLast4" TEXT,
ADD COLUMN "verificationSubmittedAt" TIMESTAMP(3),
ADD COLUMN "verificationReviewedAt" TIMESTAMP(3),
ADD COLUMN "verificationReviewedById" TEXT;

CREATE INDEX "Company_verificationStatus_createdAt_idx"
ON "Company"("verificationStatus", "createdAt");
