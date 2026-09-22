-- CreateEnum
CREATE TYPE "ModuloSucursal" AS ENUM ('FIT_MARKET', 'GYM');

-- CreateEnum
CREATE TYPE "EstadoCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('APERTURA', 'INGRESO', 'EGRESO', 'PAGO_MEMBRESIA', 'CIERRE');

-- CreateEnum
CREATE TYPE "ResultadoAcceso" AS ENUM ('PERMITIDO', 'DENEGADO');

-- AlterTable
ALTER TABLE "SocioGym" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "planId" INTEGER,
ADD COLUMN     "sucursalId" INTEGER;

-- AlterTable
ALTER TABLE "Sucursal" ADD COLUMN     "modulos" "ModuloSucursal"[] DEFAULT ARRAY['FIT_MARKET']::"ModuloSucursal"[];

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sucursalId" INTEGER;

-- CreateTable
CREATE TABLE "PlanMembresia" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracionDias" INTEGER NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanMembresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoMembresia" (
    "id" SERIAL NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "periodoDesde" TIMESTAMP(3) NOT NULL,
    "periodoHasta" TIMESTAMP(3) NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "socioId" INTEGER NOT NULL,
    "planId" INTEGER NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "PagoMembresia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccesoGym" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "resultado" "ResultadoAcceso" NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "socioId" INTEGER,
    "sucursalId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "AccesoGym_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaSesion" (
    "id" SERIAL NOT NULL,
    "estado" "EstadoCaja" NOT NULL DEFAULT 'ABIERTA',
    "montoApertura" DECIMAL(65,30) NOT NULL,
    "montoCierreDeclarado" DECIMAL(65,30),
    "montoCierreSistema" DECIMAL(65,30),
    "diferencia" DECIMAL(65,30),
    "observaciones" TEXT,
    "abiertaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "usuarioAperturaId" INTEGER NOT NULL,
    "usuarioCierreId" INTEGER,

    CONSTRAINT "CajaSesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CajaMovimiento" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "concepto" TEXT NOT NULL,
    "medio" "MedioPago",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cajaSesionId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "pagoMembresiaId" INTEGER,

    CONSTRAINT "CajaMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanMembresia_nombre_idx" ON "PlanMembresia"("nombre");

-- CreateIndex
CREATE INDEX "PagoMembresia_socioId_idx" ON "PagoMembresia"("socioId");

-- CreateIndex
CREATE INDEX "PagoMembresia_sucursalId_idx" ON "PagoMembresia"("sucursalId");

-- CreateIndex
CREATE INDEX "PagoMembresia_createdAt_idx" ON "PagoMembresia"("createdAt");

-- CreateIndex
CREATE INDEX "AccesoGym_dni_idx" ON "AccesoGym"("dni");

-- CreateIndex
CREATE INDEX "AccesoGym_sucursalId_idx" ON "AccesoGym"("sucursalId");

-- CreateIndex
CREATE INDEX "AccesoGym_createdAt_idx" ON "AccesoGym"("createdAt");

-- CreateIndex
CREATE INDEX "AccesoGym_socioId_idx" ON "AccesoGym"("socioId");

-- CreateIndex
CREATE INDEX "CajaSesion_sucursalId_estado_idx" ON "CajaSesion"("sucursalId", "estado");

-- CreateIndex
CREATE INDEX "CajaSesion_abiertaEn_idx" ON "CajaSesion"("abiertaEn");

-- CreateIndex
CREATE UNIQUE INDEX "CajaMovimiento_pagoMembresiaId_key" ON "CajaMovimiento"("pagoMembresiaId");

-- CreateIndex
CREATE INDEX "CajaMovimiento_cajaSesionId_idx" ON "CajaMovimiento"("cajaSesionId");

-- CreateIndex
CREATE INDEX "SocioGym_sucursalId_idx" ON "SocioGym"("sucursalId");

-- CreateIndex
CREATE INDEX "SocioGym_planId_idx" ON "SocioGym"("planId");

-- CreateIndex
CREATE INDEX "SocioGym_fechaVencimiento_idx" ON "SocioGym"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "Usuario_sucursalId_idx" ON "Usuario"("sucursalId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocioGym" ADD CONSTRAINT "SocioGym_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocioGym" ADD CONSTRAINT "SocioGym_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanMembresia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMembresia" ADD CONSTRAINT "PagoMembresia_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "SocioGym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMembresia" ADD CONSTRAINT "PagoMembresia_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanMembresia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMembresia" ADD CONSTRAINT "PagoMembresia_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoMembresia" ADD CONSTRAINT "PagoMembresia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccesoGym" ADD CONSTRAINT "AccesoGym_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "SocioGym"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccesoGym" ADD CONSTRAINT "AccesoGym_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccesoGym" ADD CONSTRAINT "AccesoGym_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaSesion" ADD CONSTRAINT "CajaSesion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaSesion" ADD CONSTRAINT "CajaSesion_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaSesion" ADD CONSTRAINT "CajaSesion_usuarioCierreId_fkey" FOREIGN KEY ("usuarioCierreId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMovimiento" ADD CONSTRAINT "CajaMovimiento_cajaSesionId_fkey" FOREIGN KEY ("cajaSesionId") REFERENCES "CajaSesion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMovimiento" ADD CONSTRAINT "CajaMovimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CajaMovimiento" ADD CONSTRAINT "CajaMovimiento_pagoMembresiaId_fkey" FOREIGN KEY ("pagoMembresiaId") REFERENCES "PagoMembresia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
