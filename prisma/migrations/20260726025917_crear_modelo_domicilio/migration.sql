-- CreateEnum
CREATE TYPE "EstadoDomicilioDb" AS ENUM ('ASIGNADO', 'EN_CAMINO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "Domicilio" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "referencia" TEXT,
    "estado" "EstadoDomicilioDb" NOT NULL,

    CONSTRAINT "Domicilio_pkey" PRIMARY KEY ("id")
);
