-- CreateEnum
CREATE TYPE "EstadoPedidoDb" AS ENUM ('BORRADOR', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'PAGADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT,
    "tipo" TEXT NOT NULL,
    "estado" "EstadoPedidoDb" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" INTEGER NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
