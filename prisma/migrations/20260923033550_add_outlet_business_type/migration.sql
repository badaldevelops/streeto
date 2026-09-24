-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "subtotal" REAL NOT NULL,
    "deliveryCharge" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customerId" TEXT,
    "outletId" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "customerPhone" TEXT,
    "customerName" TEXT,
    "customerLatitude" REAL,
    "customerLongitude" REAL,
    "businessType" TEXT NOT NULL DEFAULT 'FIXED_SHOP',
    "locationUpdatedAt" DATETIME,
    "queueNumber" INTEGER,
    "queuePosition" INTEGER,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "customerId", "customerLatitude", "customerLongitude", "customerName", "customerPhone", "deliveryAddress", "deliveryCharge", "id", "orderNumber", "outletId", "queueNumber", "queuePosition", "status", "subtotal", "total", "type", "updatedAt") SELECT "createdAt", "customerId", "customerLatitude", "customerLongitude", "customerName", "customerPhone", "deliveryAddress", "deliveryCharge", "id", "orderNumber", "outletId", "queueNumber", "queuePosition", "status", "subtotal", "total", "type", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
