-- Add explicit assignment type to split assembly addons from extras in admin flows.
ALTER TABLE "MenuItemAddon"
ADD COLUMN "assignmentType" TEXT NOT NULL DEFAULT 'ASSEMBLY';

-- Backfill legacy records: EXTRA addons become EXTRA assignment.
UPDATE "MenuItemAddon"
SET "assignmentType" = 'EXTRA'
WHERE "addonId" IN (
  SELECT "id"
  FROM "Addon"
  WHERE "addonType" = 'EXTRA'
);

CREATE INDEX "MenuItemAddon_assignmentType_idx" ON "MenuItemAddon"("assignmentType");
