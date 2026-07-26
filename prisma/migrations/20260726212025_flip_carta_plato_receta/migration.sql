/*
  Warnings:

  - You are about to drop the column `productoId` on the `ItemOrden` table. All the data in the column will be lost.
  - You are about to drop the column `productoId` on the `ItemPedido` table. All the data in the column will be lost.
  - Added the required column `platoId` to the `ItemOrden` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platoId` to the `ItemPedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ItemOrden" DROP COLUMN "productoId",
ADD COLUMN     "observacion" TEXT,
ADD COLUMN     "platoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ItemPedido" DROP COLUMN "productoId",
ADD COLUMN     "observacion" TEXT,
ADD COLUMN     "platoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OrdenCocina" ADD COLUMN     "observacion" TEXT;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "observacion" TEXT;
