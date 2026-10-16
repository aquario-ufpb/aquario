CREATE TABLE "EnrollmentPlan" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "profileCourseId" TEXT NOT NULL,
  "draft" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EnrollmentPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EnrollmentPlan_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "EnrollmentPlan_usuarioId_updatedAt_idx" ON "EnrollmentPlan"("usuarioId", "updatedAt");
