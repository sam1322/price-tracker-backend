-- AlterTable
ALTER TABLE "public"."OutboxEvent" ADD COLUMN     "maxRetries" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
