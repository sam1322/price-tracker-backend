/*
  Warnings:

  - You are about to drop the column `maxRetries` on the `OutboxEvent` table. All the data in the column will be lost.
  - Changed the type of `eventType` on the `OutboxEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('VIDEO_JOB_CREATED', 'VIDEO_JOB_PROCESSING', 'VIDEO_JOB_COMPLETED', 'VIDEO_JOB_FAILED');

-- AlterTable
ALTER TABLE "public"."OutboxEvent" DROP COLUMN "maxRetries",
DROP COLUMN "eventType",
ADD COLUMN     "eventType" "public"."EventType" NOT NULL;
