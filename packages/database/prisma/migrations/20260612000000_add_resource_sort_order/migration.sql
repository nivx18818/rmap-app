ALTER TABLE "resources" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

WITH ranked_resources AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "skill_id"
      ORDER BY "is_primary" DESC, "created_at" ASC, "id" ASC
    ) - 1 AS "sort_order"
  FROM "resources"
)
UPDATE "resources"
SET "sort_order" = ranked_resources."sort_order"
FROM ranked_resources
WHERE "resources"."id" = ranked_resources."id";
