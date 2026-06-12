-- CreateEnum
CREATE TYPE "MeizitoCalendarKind" AS ENUM ('customer_followup', 'service', 'general', 'custom');

-- CreateTable
CREATE TABLE "MeizitoCalendar" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "kind" "MeizitoCalendarKind" NOT NULL DEFAULT 'custom',
    "sharedWith" JSONB NOT NULL DEFAULT '[]',
    "ownerUserId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeizitoCalendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeizitoCalendarEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "time" TEXT,
    "sourceCardId" TEXT,
    "notes" TEXT,
    "reminderMinutes" INTEGER,
    "attendeeIds" JSONB NOT NULL DEFAULT '[]',
    "rsvp" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeizitoCalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeizitoCalendar_businessId_slug_key" ON "MeizitoCalendar"("businessId", "slug");

-- CreateIndex
CREATE INDEX "MeizitoCalendar_businessId_idx" ON "MeizitoCalendar"("businessId");

-- CreateIndex
CREATE INDEX "MeizitoCalendarEvent_businessId_idx" ON "MeizitoCalendarEvent"("businessId");

-- CreateIndex
CREATE INDEX "MeizitoCalendarEvent_businessId_calendarId_idx" ON "MeizitoCalendarEvent"("businessId", "calendarId");

-- CreateIndex
CREATE INDEX "MeizitoCalendarEvent_businessId_dateKey_idx" ON "MeizitoCalendarEvent"("businessId", "dateKey");

-- CreateIndex
CREATE INDEX "MeizitoCalendarEvent_sourceCardId_idx" ON "MeizitoCalendarEvent"("sourceCardId");

-- AddForeignKey
ALTER TABLE "MeizitoCalendar" ADD CONSTRAINT "MeizitoCalendar_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeizitoCalendarEvent" ADD CONSTRAINT "MeizitoCalendarEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeizitoCalendarEvent" ADD CONSTRAINT "MeizitoCalendarEvent_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "MeizitoCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
