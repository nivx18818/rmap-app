-- CreateEnum
CREATE TYPE "RoleCategory" AS ENUM ('FRONTEND', 'BACKEND', 'MOBILE', 'DEVOPS', 'DATA');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('YOUTUBE', 'DOCS', 'COURSE', 'ARTICLE');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('GROUP', 'MILESTONE', 'REQUIRED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "role_category" "RoleCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal_name" TEXT,
    "hours_per_day" DECIMAL(4,2),
    "deadline_date" TIMESTAMP,
    "estimated_weeks" INTEGER,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_nodes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "roadmap_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "skill_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "node_type" "NodeType" NOT NULL,
    "estimated_hours" DECIMAL(6,2),
    "pos_x" DECIMAL(8,2) NOT NULL,
    "pos_y" DECIMAL(8,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_node_progress" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "roadmap_node_id" TEXT NOT NULL,
    "status" "NodeStatus" NOT NULL DEFAULT 'LOCKED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "quiz_score_pct" DECIMAL(5,2),
    "quiz_passed" BOOLEAN,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_node_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activity" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "activity_date" TIMESTAMP(3) NOT NULL,
    "nodes_completed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_estimated_hours" DECIMAL(6,2),
    "role_category" "RoleCategory",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_prerequisites" (
    "skill_id" TEXT NOT NULL,
    "prerequisite_skill_id" TEXT NOT NULL,

    CONSTRAINT "skill_prerequisites_pkey" PRIMARY KEY ("skill_id","prerequisite_skill_id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" SERIAL NOT NULL,
    "skill_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "resource_type" "ResourceType" NOT NULL,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT NOT NULL,
    "option_d" TEXT NOT NULL,
    "correct_option" VARCHAR(1) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roadmaps_user_id_idx" ON "roadmaps"("user_id");

-- CreateIndex
CREATE INDEX "roadmaps_is_template_idx" ON "roadmaps"("is_template");

-- CreateIndex
CREATE INDEX "roadmaps_role_category_idx" ON "roadmaps"("role_category");

-- CreateIndex
CREATE INDEX "roadmap_nodes_roadmap_id_idx" ON "roadmap_nodes"("roadmap_id");

-- CreateIndex
CREATE INDEX "roadmap_nodes_parent_id_idx" ON "roadmap_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "user_node_progress_user_id_idx" ON "user_node_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_node_progress_user_id_roadmap_node_id_key" ON "user_node_progress"("user_id", "roadmap_node_id");

-- CreateIndex
CREATE INDEX "daily_activity_user_id_idx" ON "daily_activity"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_user_id_activity_date_key" ON "daily_activity"("user_id", "activity_date");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "resources_skill_id_idx" ON "resources"("skill_id");

-- CreateIndex
CREATE INDEX "quiz_questions_skill_id_idx" ON "quiz_questions"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_nodes" ADD CONSTRAINT "roadmap_nodes_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_nodes" ADD CONSTRAINT "roadmap_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "roadmap_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_nodes" ADD CONSTRAINT "roadmap_nodes_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_node_progress" ADD CONSTRAINT "user_node_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_node_progress" ADD CONSTRAINT "user_node_progress_roadmap_node_id_fkey" FOREIGN KEY ("roadmap_node_id") REFERENCES "roadmap_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_prerequisites" ADD CONSTRAINT "skill_prerequisites_prerequisite_skill_id_fkey" FOREIGN KEY ("prerequisite_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
