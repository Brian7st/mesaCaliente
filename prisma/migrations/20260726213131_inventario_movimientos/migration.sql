-- CreateEnum
CREATE TYPE "TipoMovimientoDb" AS ENUM ('ENTRADA', 'SALIDA', 'RESERVA', 'LIBERACION');

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimientoDb" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservaInsumo" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "ReservaInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimientoInventario_productoId_fecha_idx" ON "MovimientoInventario"("productoId", "fecha");

-- CreateIndex
CREATE INDEX "ReservaInsumo_pedidoId_idx" ON "ReservaInsumo"("pedidoId");
