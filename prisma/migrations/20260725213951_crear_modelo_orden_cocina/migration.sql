-- CreateEnum
CREATE TYPE "EstadoOrdenCocinaDb" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTA');

-- CreateTable
CREATE TABLE "OrdenCocina" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "estado" "EstadoOrdenCocinaDb" NOT NULL,

    CONSTRAINT "OrdenCocina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrden" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "preparado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ItemOrden_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemOrden" ADD CONSTRAINT "ItemOrden_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenCocina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
