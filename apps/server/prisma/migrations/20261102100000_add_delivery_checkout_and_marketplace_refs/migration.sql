CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "fee" REAL NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "DeliveryZone_name_key" ON "DeliveryZone"("name");
CREATE INDEX "DeliveryZone_isActive_idx" ON "DeliveryZone"("isActive");

ALTER TABLE "Order" ADD COLUMN "fulfillmentType" TEXT NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'AT_COUNTER';
ALTER TABLE "Order" ADD COLUMN "cashChangeFor" REAL;
ALTER TABLE "Order" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryComplement" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryZoneId" TEXT REFERENCES "DeliveryZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD COLUMN "deliveryZoneName" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryFee" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "salesChannel" TEXT NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "Order" ADD COLUMN "externalOrderId" TEXT;

CREATE UNIQUE INDEX "Order_salesChannel_externalOrderId_key" ON "Order"("salesChannel", "externalOrderId");
