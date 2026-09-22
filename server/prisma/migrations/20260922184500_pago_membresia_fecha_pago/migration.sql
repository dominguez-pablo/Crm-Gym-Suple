-- AlterTable
ALTER TABLE "PagoMembresia" ADD COLUMN "fechaPago" TIMESTAMP(3);

UPDATE "PagoMembresia" SET "fechaPago" = "createdAt" WHERE "fechaPago" IS NULL;

ALTER TABLE "PagoMembresia" ALTER COLUMN "fechaPago" SET NOT NULL;
ALTER TABLE "PagoMembresia" ALTER COLUMN "fechaPago" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "PagoMembresia_fechaPago_idx" ON "PagoMembresia"("fechaPago");
