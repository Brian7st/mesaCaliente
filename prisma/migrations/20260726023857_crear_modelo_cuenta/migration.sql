-- CreateEnum
CREATE TYPE "EstadoCuentaDb" AS ENUM ('ABIERTA', 'PAGADA');

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT,
    "estado" "EstadoCuentaDb" NOT NULL,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaCuenta" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "LineaCuenta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LineaCuenta" ADD CONSTRAINT "LineaCuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
