-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('VIDEO', 'AUDIO', 'IMAGE');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'GENERATING_SCRIPT', 'SCRIPT_GENERATED', 'GENERATING_ASSETS', 'ASSETS_GENERATED', 'RENDERING_VIDEO', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."VideoJob" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "scriptText" TEXT,
    "videoUrl" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobAsset" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" "public"."AssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OutboxEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobAsset_jobId_type_idx" ON "public"."JobAsset"("jobId", "type");

-- AddForeignKey
ALTER TABLE "public"."JobAsset" ADD CONSTRAINT "JobAsset_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."VideoJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OutboxEvent" ADD CONSTRAINT "OutboxEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."VideoJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
