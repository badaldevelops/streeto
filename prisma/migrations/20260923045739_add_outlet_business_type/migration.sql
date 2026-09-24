-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outlet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "deliveryRadiusKm" REAL NOT NULL DEFAULT 5,
    "businessType" TEXT NOT NULL DEFAULT 'FIXED_SHOP',
    "locationUpdatedAt" DATETIME,
    "deliveryCharge" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "Outlet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Outlet" ("address", "companyId", "createdAt", "deliveryCharge", "deliveryRadiusKm", "id", "isActive", "latitude", "longitude", "name", "phone", "updatedAt") SELECT "address", "companyId", "createdAt", "deliveryCharge", "deliveryRadiusKm", "id", "isActive", "latitude", "longitude", "name", "phone", "updatedAt" FROM "Outlet";
DROP TABLE "Outlet";
ALTER TABLE "new_Outlet" RENAME TO "Outlet";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
