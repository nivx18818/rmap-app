CREATE TYPE "MilestoneTestSuiteStatus" AS ENUM ('NOT_GENERATED', 'GENERATING', 'READY', 'FAILED');

CREATE TABLE "milestone_test_suites" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "roadmap_node_id" TEXT NOT NULL,
    "status" "MilestoneTestSuiteStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "title" TEXT,
    "summary" TEXT,
    "test_cases" JSONB,
    "test_file_content" TEXT,
    "pass_threshold_pct" INTEGER NOT NULL DEFAULT 80,
    "generation_started_at" TIMESTAMP(3),
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_test_suites_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "milestone_submissions"
ADD COLUMN "test_suite_id" TEXT,
ADD COLUMN "pass_rate_pct" DECIMAL(5,2),
ADD COLUMN "passed_tests" INTEGER,
ADD COLUMN "total_tests" INTEGER;

CREATE UNIQUE INDEX "milestone_test_suites_roadmap_node_id_key" ON "milestone_test_suites"("roadmap_node_id");
CREATE INDEX "milestone_submissions_test_suite_id_idx" ON "milestone_submissions"("test_suite_id");

ALTER TABLE "milestone_test_suites"
ADD CONSTRAINT "milestone_test_suites_roadmap_node_id_fkey"
FOREIGN KEY ("roadmap_node_id") REFERENCES "roadmap_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "milestone_submissions"
ADD CONSTRAINT "milestone_submissions_test_suite_id_fkey"
FOREIGN KEY ("test_suite_id") REFERENCES "milestone_test_suites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
