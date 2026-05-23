-- CreateEnum
CREATE TYPE "QuizGenerationStatus" AS ENUM ('NOT_GENERATED', 'GENERATING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "skills"
ADD COLUMN "quiz_generation_status" "QuizGenerationStatus" NOT NULL DEFAULT 'NOT_GENERATED',
ADD COLUMN "quiz_generation_started_at" TIMESTAMP(3),
ADD COLUMN "quiz_generated_at" TIMESTAMP(3);

-- Preserve status for databases that already have seeded quiz questions.
UPDATE "skills"
SET "quiz_generation_status" = 'READY',
    "quiz_generated_at" = CURRENT_TIMESTAMP
WHERE (
  SELECT COUNT(*)
  FROM "quiz_questions"
  WHERE "quiz_questions"."skill_id" = "skills"."id"
) >= 5;
