-- CreateTable
CREATE TABLE "ShopKlik" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "naam" TEXT,
    "bron" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
