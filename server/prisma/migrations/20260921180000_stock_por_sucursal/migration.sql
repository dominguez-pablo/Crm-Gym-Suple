-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockSucursal" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,

    CONSTRAINT "StockSucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrasladoStock" (
    "id" SERIAL NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sucursalOrigenId" INTEGER NOT NULL,
    "sucursalDestinoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "TrasladoStock_pkey" PRIMARY KEY ("id")
);

-- Seed sucursales
INSERT INTO "Sucursal" ("nombre", "activa", "createdAt", "updatedAt")
VALUES
  ('Fit Market Centro', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Fit Market Gym', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Backfill stock: Centro keeps current Producto.stock, Gym starts at 0
INSERT INTO "StockSucursal" ("cantidad", "stockMinimo", "createdAt", "updatedAt", "sucursalId", "productoId")
SELECT p."stock", p."stockMinimo", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, s."id", p."id"
FROM "Producto" p
CROSS JOIN "Sucursal" s;

UPDATE "StockSucursal" AS ss
SET "cantidad" = 0
FROM "Sucursal" s
WHERE ss."sucursalId" = s."id"
  AND s."nombre" = 'Fit Market Gym';

-- Assign existing sales to Centro before making sucursalId required
ALTER TABLE "Venta" ADD COLUMN "sucursalId" INTEGER;

UPDATE "Venta"
SET "sucursalId" = (SELECT "id" FROM "Sucursal" WHERE "nombre" = 'Fit Market Centro' LIMIT 1)
WHERE "sucursalId" IS NULL;

ALTER TABLE "Venta" ALTER COLUMN "sucursalId" SET NOT NULL;

-- Drop old product-level stock
ALTER TABLE "Producto" DROP COLUMN "stock";
ALTER TABLE "Producto" DROP COLUMN "stockMinimo";

-- CreateIndex
CREATE UNIQUE INDEX "StockSucursal_sucursalId_productoId_key" ON "StockSucursal"("sucursalId", "productoId");

-- CreateIndex
CREATE INDEX "StockSucursal_productoId_idx" ON "StockSucursal"("productoId");

-- CreateIndex
CREATE INDEX "TrasladoStock_productoId_idx" ON "TrasladoStock"("productoId");

-- CreateIndex
CREATE INDEX "TrasladoStock_createdAt_idx" ON "TrasladoStock"("createdAt");

-- CreateIndex
CREATE INDEX "Venta_sucursalId_idx" ON "Venta"("sucursalId");

-- AddForeignKey
ALTER TABLE "StockSucursal" ADD CONSTRAINT "StockSucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockSucursal" ADD CONSTRAINT "StockSucursal_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrasladoStock" ADD CONSTRAINT "TrasladoStock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrasladoStock" ADD CONSTRAINT "TrasladoStock_sucursalOrigenId_fkey" FOREIGN KEY ("sucursalOrigenId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrasladoStock" ADD CONSTRAINT "TrasladoStock_sucursalDestinoId_fkey" FOREIGN KEY ("sucursalDestinoId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrasladoStock" ADD CONSTRAINT "TrasladoStock_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
