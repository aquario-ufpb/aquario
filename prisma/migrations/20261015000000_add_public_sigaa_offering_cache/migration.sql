-- Public SIGAA offers only: no student snapshot, credentials or planning preferences.
CREATE TABLE "PublicSigaaOfferingCache" (
    "courseId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicSigaaOfferingCache_pkey" PRIMARY KEY ("courseId", "semester")
);
CREATE INDEX "PublicSigaaOfferingCache_semester_observedAt_idx" ON "PublicSigaaOfferingCache"("semester", "observedAt");
