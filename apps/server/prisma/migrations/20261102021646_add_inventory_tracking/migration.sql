-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "removedIngredientsJson" TEXT;

-- CreateTable
CREATE TABLE "InventoryIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UNIT',
    "currentQuantity" REAL,
    "lowStockThreshold" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" DATETIME,
    CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockReservation_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "InventoryIngredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ingredientId" TEXT NOT NULL,
    "orderId" TEXT,
    "quantityDelta" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "InventoryIngredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuItemAddon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menuItemId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "inventoryIngredientId" TEXT,
    "stockQuantity" REAL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "assignmentType" TEXT NOT NULL DEFAULT 'ASSEMBLY',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MenuItemAddon_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuItemAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MenuItemAddon_inventoryIngredientId_fkey" FOREIGN KEY ("inventoryIngredientId") REFERENCES "InventoryIngredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MenuItemAddon" ("addonId", "assignmentType", "displayOrder", "id", "isRequired", "menuItemId") SELECT "addonId", "assignmentType", "displayOrder", "id", "isRequired", "menuItemId" FROM "MenuItemAddon";
DROP TABLE "MenuItemAddon";
ALTER TABLE "new_MenuItemAddon" RENAME TO "MenuItemAddon";
CREATE INDEX "MenuItemAddon_menuItemId_idx" ON "MenuItemAddon"("menuItemId");
CREATE INDEX "MenuItemAddon_addonId_idx" ON "MenuItemAddon"("addonId");
CREATE INDEX "MenuItemAddon_assignmentType_idx" ON "MenuItemAddon"("assignmentType");
CREATE UNIQUE INDEX "MenuItemAddon_menuItemId_addonId_key" ON "MenuItemAddon"("menuItemId", "addonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "InventoryIngredient_name_key" ON "InventoryIngredient"("name");

-- CreateIndex
CREATE INDEX "InventoryIngredient_isActive_idx" ON "InventoryIngredient"("isActive");

-- CreateIndex
CREATE INDEX "StockReservation_ingredientId_status_idx" ON "StockReservation"("ingredientId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_orderId_ingredientId_key" ON "StockReservation"("orderId", "ingredientId");

-- CreateIndex
CREATE INDEX "InventoryMovement_ingredientId_createdAt_idx" ON "InventoryMovement"("ingredientId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");
