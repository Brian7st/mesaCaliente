-- CreateTable
CREATE TABLE "PlatoCatalogo" (
    "platoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "disponible" BOOLEAN NOT NULL,

    CONSTRAINT "PlatoCatalogo_pkey" PRIMARY KEY ("platoId")
);
