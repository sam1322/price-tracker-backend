/*
  Warnings:

  - Added the required column `userId` to the `VideoJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."VideoJob" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "VideoJob_userId_idx" ON "public"."VideoJob"("userId");

-- CreateIndex
CREATE INDEX "VideoJob_userId_status_idx" ON "public"."VideoJob"("userId", "status");

-- AddForeignKey
ALTER TABLE "public"."VideoJob" ADD CONSTRAINT "VideoJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
