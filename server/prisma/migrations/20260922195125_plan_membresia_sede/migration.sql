-- AlterTable
ALTER TABLE "PlanMembresia" ADD COLUMN     "multisede" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sucursalId" INTEGER;

-- CreateIndex
CREATE INDEX "PlanMembresia_sucursalId_idx" ON "PlanMembresia"("sucursalId");

-- AddForeignKey
ALTER TABLE "PlanMembresia" ADD CONSTRAINT "PlanMembresia_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
