-- CreateEnum
CREATE TYPE "EstadoMesaDb" AS ENUM ('LIBRE', 'OCUPADA');

-- CreateTable
CREATE TABLE "Mesa" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoMesaDb" NOT NULL,

    CONSTRAINT "Mesa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mesa_numero_key" ON "Mesa"("numero");
