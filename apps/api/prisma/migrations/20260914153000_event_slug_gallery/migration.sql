-- Slug público e galeria de fotos dos eventos.
ALTER TABLE "Event" ADD COLUMN "slug" TEXT;

UPDATE "Event" SET "slug" = "id" WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "Event" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

CREATE TABLE "EventImage" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventImage_eventId_sortOrder_idx" ON "EventImage"("eventId", "sortOrder");

ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventImage" ADD CONSTRAINT "EventImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
