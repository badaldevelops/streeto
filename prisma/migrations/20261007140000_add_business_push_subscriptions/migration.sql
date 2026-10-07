CREATE TABLE "BusinessPushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessPushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessPushSubscription_endpoint_key" ON "BusinessPushSubscription"("endpoint");
CREATE INDEX "BusinessPushSubscription_companyId_idx" ON "BusinessPushSubscription"("companyId");
CREATE INDEX "BusinessPushSubscription_userId_idx" ON "BusinessPushSubscription"("userId");

ALTER TABLE "BusinessPushSubscription" ADD CONSTRAINT "BusinessPushSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessPushSubscription" ADD CONSTRAINT "BusinessPushSubscription_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
