-- AlterTable
ALTER TABLE "PagoMembresia" ADD COLUMN "recargo" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "PagoMembresia" ADD COLUMN "cuotas" INTEGER;
