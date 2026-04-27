-- Add CHECK constraint for roadmap is_template consistency
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmap_fields_consistent" CHECK (
    (is_template = true AND user_id IS NULL AND hours_per_day IS NULL AND deadline_date IS NULL)
    OR
    (is_template = false AND user_id IS NOT NULL AND hours_per_day IS NOT NULL AND deadline_date IS NOT NULL)
);