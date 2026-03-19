-- Fix: Set isRequired = true for all ASSEMBLY addons (removables/default ingredients)
-- and ensure EXTRA addons have isRequired = false
UPDATE "MenuItemAddon"
SET "isRequired" = true
WHERE "assignmentType" = 'ASSEMBLY';

-- Ensure EXTRA addons have isRequired = false (though this should already be the case)
UPDATE "MenuItemAddon"
SET "isRequired" = false
WHERE "assignmentType" = 'EXTRA';
