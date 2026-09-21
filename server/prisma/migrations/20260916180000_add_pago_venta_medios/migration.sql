-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CONSIGNACION', 'OTRO');

-- CreateTable
CREATE TABLE "PagoVenta" (
    "id" SERIAL NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "cuotas" INTEGER,
    "nota" TEXT,
    "ventaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PagoVenta_ventaId_idx" ON "PagoVenta"("ventaId");

-- AddForeignKey
ALTER TABLE "PagoVenta" ADD CONSTRAINT "PagoVenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill existing sales
INSERT INTO "PagoVenta" ("medio", "monto", "nota", "ventaId", "updatedAt")
SELECT
  CASE "medioPago"
    WHEN 'EFECTIVO' THEN 'EFECTIVO'::"MedioPago"
    WHEN 'TRANSFERENCIA' THEN 'TRANSFERENCIA'::"MedioPago"
    WHEN 'TARJETA' THEN 'DEBITO'::"MedioPago"
    WHEN 'CUENTA_CORRIENTE' THEN 'CONSIGNACION'::"MedioPago"
    ELSE 'OTRO'::"MedioPago"
  END,
  "total",
  CASE
    WHEN "medioPago" NOT IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CUENTA_CORRIENTE')
      THEN "medioPago"
    ELSE NULL
  END,
  "id",
  CURRENT_TIMESTAMP
FROM "Venta";
