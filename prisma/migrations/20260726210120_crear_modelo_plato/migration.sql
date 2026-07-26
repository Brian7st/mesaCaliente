-- CreateEnum
CREATE TYPE "CategoriaPlatoDb" AS ENUM ('ENTRADA', 'PRINCIPAL', 'POSTRE', 'BEBIDA', 'ACOMPANAMIENTO');

-- CreateTable
CREATE TABLE "Plato" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "categoria" "CategoriaPlatoDb" NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaReceta" (
    "id" TEXT NOT NULL,
    "platoId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "LineaReceta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LineaReceta" ADD CONSTRAINT "LineaReceta_platoId_fkey" FOREIGN KEY ("platoId") REFERENCES "Plato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
