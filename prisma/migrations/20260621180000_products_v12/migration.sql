-- CreateEnum
CREATE TYPE "CatalogProductType" AS ENUM ('goods', 'services');

-- CreateEnum
CREATE TYPE "CatalogProductStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "CatalogPriceListTier" AS ENUM ('retail', 'wholesale', 'partner');

-- CreateTable
CREATE TABLE "CatalogPriceList" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "CatalogPriceListTier",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogPriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "accountingCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL DEFAULT '',
    "type" "CatalogProductType" NOT NULL DEFAULT 'goods',
    "categoryIds" JSONB NOT NULL DEFAULT '[]',
    "barcode" TEXT,
    "images" JSONB NOT NULL DEFAULT '{}',
    "salesDescription" TEXT,
    "purchaseDescription" TEXT,
    "prices" JSONB NOT NULL DEFAULT '{}',
    "purchasePrice" INTEGER NOT NULL DEFAULT 0,
    "units" JSONB NOT NULL DEFAULT '{}',
    "inventory" JSONB NOT NULL DEFAULT '{}',
    "tax" JSONB NOT NULL DEFAULT '{}',
    "status" "CatalogProductStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogPriceList_businessId_idx" ON "CatalogPriceList"("businessId");

-- CreateIndex
CREATE INDEX "CatalogPriceList_businessId_sortOrder_idx" ON "CatalogPriceList"("businessId", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogCategory_businessId_idx" ON "CatalogCategory"("businessId");

-- CreateIndex
CREATE INDEX "CatalogCategory_businessId_parentId_idx" ON "CatalogCategory"("businessId", "parentId");

-- CreateIndex
CREATE INDEX "CatalogCategory_businessId_sortOrder_idx" ON "CatalogCategory"("businessId", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogProduct_businessId_idx" ON "CatalogProduct"("businessId");

-- CreateIndex
CREATE INDEX "CatalogProduct_businessId_status_idx" ON "CatalogProduct"("businessId", "status");

-- CreateIndex
CREATE INDEX "CatalogProduct_businessId_name_idx" ON "CatalogProduct"("businessId", "name");

-- CreateIndex
CREATE INDEX "CatalogProduct_businessId_type_idx" ON "CatalogProduct"("businessId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_businessId_accountingCode_key" ON "CatalogProduct"("businessId", "accountingCode");

-- AddForeignKey
ALTER TABLE "CatalogPriceList" ADD CONSTRAINT "CatalogPriceList_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CatalogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
