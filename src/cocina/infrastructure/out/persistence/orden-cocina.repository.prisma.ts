import { Injectable } from '@nestjs/common';
import {
  EstadoOrdenCocinaDb,
  OrdenCocina as OrdenRow,
  ItemOrden as ItemOrdenRow,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { OrdenCocinaRepository } from '../../../domain/ports/out/orden-cocina.repository';
import { OrdenCocina } from '../../../domain/model/orden-cocina.aggregate';
import { ItemOrden } from '../../../domain/model/item-orden.entity';
import { EstadoOrdenCocina } from '../../../domain/model/estado-orden-cocina.vo';

type OrdenConItems = OrdenRow & { items: ItemOrdenRow[] };

@Injectable()
export class OrdenCocinaRepositoryPrisma implements OrdenCocinaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<OrdenCocina | null> {
    const row = await this.prisma.ordenCocina.findUnique({
      where: { id },
      include: { items: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async buscarPorPedidoId(pedidoId: string): Promise<OrdenCocina | null> {
    const row = await this.prisma.ordenCocina.findFirst({
      where: { pedidoId },
      include: { items: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async listar(estado?: EstadoOrdenCocina): Promise<OrdenCocina[]> {
    const rows = await this.prisma.ordenCocina.findMany({
      where: estado
        ? { estado: estado as unknown as EstadoOrdenCocinaDb }
        : undefined,
      include: { items: true },
    });
    return rows.map((row) => this.aDominio(row));
  }

  async guardar(orden: OrdenCocina): Promise<void> {
    const estado = orden.estado as unknown as EstadoOrdenCocinaDb;
    await this.prisma.$transaction([
      this.prisma.ordenCocina.upsert({
        where: { id: orden.id },
        create: {
          id: orden.id,
          pedidoId: orden.pedidoId,
          estado,
        },
        update: { estado },
      }),
      this.prisma.itemOrden.deleteMany({ where: { ordenId: orden.id } }),
      this.prisma.itemOrden.createMany({
        data: orden.items.map((item) => ({
          ordenId: orden.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          preparado: item.preparado,
        })),
      }),
    ]);
  }

  private aDominio(row: OrdenConItems): OrdenCocina {
    return OrdenCocina.reconstituir({
      id: row.id,
      pedidoId: row.pedidoId,
      estado: row.estado as unknown as EstadoOrdenCocina,
      items: row.items.map(
        (item) =>
          new ItemOrden(item.productoId, item.cantidad, item.preparado),
      ),
    });
  }
}
