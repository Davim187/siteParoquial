-- AlterTable
ALTER TABLE "News" ADD COLUMN "showProgress" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "News" ADD COLUMN "progressLabel" TEXT;
ALTER TABLE "News" ADD COLUMN "progressCurrent" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "News" ADD COLUMN "progressGoal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "NewsImage" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NewsImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsImage_newsId_sortOrder_idx" ON "NewsImage"("newsId", "sortOrder");
CREATE INDEX "News_showProgress_idx" ON "News"("showProgress");

-- AddForeignKey
ALTER TABLE "NewsImage" ADD CONSTRAINT "NewsImage_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsImage" ADD CONSTRAINT "NewsImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
