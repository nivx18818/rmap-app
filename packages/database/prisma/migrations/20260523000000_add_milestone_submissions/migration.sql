-- CreateEnum
CREATE TYPE "MilestoneSubmissionStatus" AS ENUM ('RUNNING', 'PASSED', 'FAILED', 'ERROR');

-- CreateTable
CREATE TABLE "milestone_submissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "roadmap_node_id" TEXT NOT NULL,
    "repo_url" TEXT NOT NULL,
    "test_command" TEXT NOT NULL DEFAULT 'npm test',
    "status" "MilestoneSubmissionStatus" NOT NULL,
    "output_log" TEXT,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "milestone_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestone_submissions_user_id_roadmap_node_id_idx" ON "milestone_submissions"("user_id", "roadmap_node_id");

-- AddForeignKey
ALTER TABLE "milestone_submissions" ADD CONSTRAINT "milestone_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_submissions" ADD CONSTRAINT "milestone_submissions_roadmap_node_id_fkey" FOREIGN KEY ("roadmap_node_id") REFERENCES "roadmap_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
