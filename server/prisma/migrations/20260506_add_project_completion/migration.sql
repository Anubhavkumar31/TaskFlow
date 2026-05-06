-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ON_HOLD');

-- AlterTable
ALTER TABLE "Project"
  ADD COLUMN "completionStatus" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "completedAt" TIMESTAMP(3);
