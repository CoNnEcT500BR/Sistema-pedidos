-- Backfill: habilitar SIZE_CHANGE para bebidas e batatas

-- 1) Migrar addons existentes de upgrade para o novo tipo
UPDATE "Addon"
SET "addonType" = 'SIZE_CHANGE',
    "description" = 'Troca bebida para tamanho M [meta|station=DRINKS|scope=DRINK|priority=CRITICAL]',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Upgrade Bebida para M';

UPDATE "Addon"
SET "addonType" = 'SIZE_CHANGE',
    "description" = 'Troca bebida para tamanho G [meta|station=DRINKS|scope=DRINK|priority=CRITICAL]',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Upgrade Bebida para G';

UPDATE "Addon"
SET "addonType" = 'SIZE_CHANGE',
    "description" = 'Troca batata para tamanho M [meta|station=SIDES|scope=SIDE|priority=CRITICAL]',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Upgrade Batata para M';

UPDATE "Addon"
SET "addonType" = 'SIZE_CHANGE',
    "description" = 'Troca batata para tamanho G [meta|station=SIDES|scope=SIDE|priority=CRITICAL]',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Upgrade Batata para G';

-- 2) Vincular upgrades de bebida em todos os itens de bebida por tamanho
INSERT INTO "MenuItemAddon" ("id", "menuItemId", "addonId", "isRequired", "displayOrder")
SELECT lower(hex(randomblob(16))), mi."id", a."id", false, 90
FROM "MenuItem" mi
JOIN "Category" c ON c."id" = mi."categoryId"
JOIN "Addon" a ON a."name" = 'Upgrade Bebida para M'
WHERE c."name" = 'Bebidas'
  AND NOT EXISTS (
    SELECT 1
    FROM "MenuItemAddon" mia
    WHERE mia."menuItemId" = mi."id" AND mia."addonId" = a."id"
  );

INSERT INTO "MenuItemAddon" ("id", "menuItemId", "addonId", "isRequired", "displayOrder")
SELECT lower(hex(randomblob(16))), mi."id", a."id", false, 91
FROM "MenuItem" mi
JOIN "Category" c ON c."id" = mi."categoryId"
JOIN "Addon" a ON a."name" = 'Upgrade Bebida para G'
WHERE c."name" = 'Bebidas'
  AND NOT EXISTS (
    SELECT 1
    FROM "MenuItemAddon" mia
    WHERE mia."menuItemId" = mi."id" AND mia."addonId" = a."id"
  );

-- 3) Vincular upgrades de batata em itens de batata frita
INSERT INTO "MenuItemAddon" ("id", "menuItemId", "addonId", "isRequired", "displayOrder")
SELECT lower(hex(randomblob(16))), mi."id", a."id", false, 92
FROM "MenuItem" mi
JOIN "Addon" a ON a."name" = 'Upgrade Batata para M'
WHERE mi."name" LIKE 'Batata Frita %'
  AND NOT EXISTS (
    SELECT 1
    FROM "MenuItemAddon" mia
    WHERE mia."menuItemId" = mi."id" AND mia."addonId" = a."id"
  );

INSERT INTO "MenuItemAddon" ("id", "menuItemId", "addonId", "isRequired", "displayOrder")
SELECT lower(hex(randomblob(16))), mi."id", a."id", false, 93
FROM "MenuItem" mi
JOIN "Addon" a ON a."name" = 'Upgrade Batata para G'
WHERE mi."name" LIKE 'Batata Frita %'
  AND NOT EXISTS (
    SELECT 1
    FROM "MenuItemAddon" mia
    WHERE mia."menuItemId" = mi."id" AND mia."addonId" = a."id"
  );
