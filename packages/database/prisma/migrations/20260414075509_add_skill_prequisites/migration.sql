/*
  Warnings:

  - You are about to drop the column `category` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `skills` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "resources" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "roadmaps" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "category",
DROP COLUMN "description",
ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "skill_prerequisites" (
    "skill_id" TEXT NOT NULL,
    "prerequisite_id" TEXT NOT NULL,

    CONSTRAINT "skill_prerequisites_pkey" PRIMARY KEY ("skill_id","prerequisite_id")
);

-- CreateIndex
CREATE INDEX "skill_prerequisites_prerequisite_id_idx" ON "skill_prerequisites"("prerequisite_id");

-- AddForeignKey
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
