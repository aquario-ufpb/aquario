CREATE TABLE "CalendarRoomBinding" (
  "usuarioId" TEXT NOT NULL,
  "profileCourseId" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "scheduleKey" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "allocationId" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalendarRoomBinding_pkey" PRIMARY KEY ("usuarioId", "semester", "sourceKey"),
  CONSTRAINT "CalendarRoomBinding_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
