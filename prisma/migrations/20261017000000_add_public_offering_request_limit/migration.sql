CREATE TABLE "PublicOfferingRequestLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "PublicOfferingRequestLimit_expiresAt_idx" ON "PublicOfferingRequestLimit"("expiresAt");
