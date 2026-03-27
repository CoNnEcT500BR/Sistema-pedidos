-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Addon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "addonType" TEXT NOT NULL DEFAULT 'EXTRA',
    "price" REAL NOT NULL DEFAULT 0,
    "scope" TEXT NOT NULL DEFAULT 'GENERAL',
    "station" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'FAST',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Addon" ("addonType", "createdAt", "description", "id", "isActive", "name", "price", "updatedAt") SELECT "addonType", "createdAt", "description", "id", "isActive", "name", "price", "updatedAt" FROM "Addon";
DROP TABLE "Addon";
ALTER TABLE "new_Addon" RENAME TO "Addon";
CREATE UNIQUE INDEX "Addon_name_key" ON "Addon"("name");
CREATE INDEX "Addon_addonType_idx" ON "Addon"("addonType");
CREATE INDEX "Addon_isActive_idx" ON "Addon"("isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
