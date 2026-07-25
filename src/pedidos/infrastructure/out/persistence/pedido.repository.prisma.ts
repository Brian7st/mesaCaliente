import { Injectable } from '@nestjs/common';
import {
  EstadoPedidoDb,
  Pedido as PedidoRow,
  ItemPedido as ItemPedidoRow,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';
import { Pedido, TipoPedido } from '../../../domain/model/pedido.aggregate';
import { ItemPedido } from '../../../domain/model/item-pedido.entity';
import { Dinero } from '../../../domain/model/dinero.vo';
import { EstadoPedido } from '../../../domain/model/estado-pedido.vo';

type PedidoConItems = PedidoRow & { items: ItemPedidoRow[] };

@Injectable()
export class PedidoRepositoryPrisma implements PedidoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Pedido | null> {
    const row = await this.prisma.pedido.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async listar(estado?: EstadoPedido): Promise<Pedido[]> {
    const rows = await this.prisma.pedido.findMany({
      where: estado ? { estado: estado as unknown as EstadoPedidoDb } : undefined,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.aDominio(row));
  }

  async guardar(pedido: Pedido): Promise<void> {
    const estado = pedido.estado as unknown as EstadoPedidoDb;
    // Guardado del Aggregate completo (raiz + items) en una sola transaccion:
    // upsert de la raiz y reemplazo de sus items para reflejar el estado actual.
    await this.prisma.$transaction([
      this.prisma.pedido.upsert({
        where: { id: pedido.id },
        create: {
          id: pedido.id,
          mesaId: pedido.mesaId,
          tipo: pedido.tipo,
          estado,
          createdAt: pedido.createdAt,
        },
        update: {
          mesaId: pedido.mesaId,
          tipo: pedido.tipo,
          estado,
        },
      }),
      this.prisma.itemPedido.deleteMany({ where: { pedidoId: pedido.id } }),
      this.prisma.itemPedido.createMany({
        data: pedido.items.map((item) => ({
          id: item.id,
          pedidoId: pedido.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario.monto,
        })),
      }),
    ]);
  }

  private aDominio(row: PedidoConItems): Pedido {
    return Pedido.reconstituir({
      id: row.id,
      mesaId: row.mesaId,
      tipo: row.tipo as TipoPedido,
      estado: row.estado as unknown as EstadoPedido,
      items: row.items.map(
        (item) =>
          new ItemPedido(
            item.id,
            item.productoId,
            item.cantidad,
            new Dinero(item.precioUnitario),
          ),
      ),
      createdAt: row.createdAt,
    });
  }
}
