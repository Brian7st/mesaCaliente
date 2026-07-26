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
import { aFilaOutbox } from '../../../../shared/infrastructure/outbox/outbox.mapper';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

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

  async listar(
    paginacion: ParametrosPaginacion,
    estado?: EstadoPedido,
  ): Promise<Pagina<Pedido>> {
    const where = estado
      ? { estado: estado as unknown as EstadoPedidoDb }
      : undefined;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.pedido.count({ where }),
    ]);
    return {
      items: rows.map((row) => this.aDominio(row)),
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }

  async guardar(pedido: Pedido): Promise<void> {
    const estado = pedido.estado as unknown as EstadoPedidoDb;
    const eventos = pedido.obtenerEventos();
    // Guardado del Aggregate completo (raiz + items) y sus Domain Events en el
    // Outbox, todo en una sola transaccion (patron Outbox).
    await this.prisma.$transaction([
      this.prisma.pedido.upsert({
        where: { id: pedido.id },
        create: {
          id: pedido.id,
          mesaId: pedido.mesaId,
          tipo: pedido.tipo,
          estado,
          createdAt: pedido.createdAt,
          calle: pedido.direccion?.calle ?? null,
          ciudad: pedido.direccion?.ciudad ?? null,
          referencia: pedido.direccion?.referencia ?? null,
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
      ...(eventos.length > 0
        ? [this.prisma.outboxEvent.createMany({ data: eventos.map(aFilaOutbox) })]
        : []),
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
      direccion: row.calle
        ? {
            calle: row.calle,
            ciudad: row.ciudad ?? '',
            referencia: row.referencia ?? undefined,
          }
        : null,
    });
  }
}
