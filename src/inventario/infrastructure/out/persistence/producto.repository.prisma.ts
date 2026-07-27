import { Injectable } from '@nestjs/common';
import {
  Producto as ProductoRow,
  MovimientoInventario as MovimientoRow,
  TipoMovimientoDb,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ProductoRepository } from '../../../domain/ports/out/producto.repository';
import { Producto } from '../../../domain/model/producto.aggregate';
import { MovimientoInventario } from '../../../domain/model/movimiento-inventario.entity';
import { TipoMovimiento } from '../../../domain/model/tipo-movimiento.vo';
import { Cantidad } from '../../../domain/model/cantidad.vo';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

@Injectable()
export class ProductoRepositoryPrisma implements ProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Producto | null> {
    const row = await this.prisma.producto.findUnique({ where: { id } });
    return row ? this.aDominio(row) : null;
  }

  async listar(paginacion: ParametrosPaginacion): Promise<Pagina<Producto>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.producto.findMany({
        orderBy: { nombre: 'asc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.producto.count(),
    ]);
    return {
      items: rows.map((row) => this.aDominio(row)),
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }

  async listarMovimientos(
    productoId: string,
    paginacion: ParametrosPaginacion,
  ): Promise<Pagina<MovimientoInventario>> {
    const where = { productoId };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.movimientoInventario.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);
    return {
      items: rows.map((row) => this.aMovimientoDominio(row)),
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }

  async guardar(producto: Producto): Promise<void> {
    // Aggregate + movimientos de kardex en una sola transaccion.
    await this.prisma.$transaction([
      this.prisma.producto.upsert({
        where: { id: producto.id },
        create: this.aDatos(producto),
        update: {
          stock: producto.stock.valor,
          stockReservado: producto.stockReservado.valor,
        },
      }),
      ...this.movimientosCreate(producto),
    ]);
  }

  async guardarVarios(productos: Producto[]): Promise<void> {
    // Persistencia atomica de la reserva de todos los productos (patron Saga)
    // junto con sus movimientos de kardex.
    await this.prisma.$transaction([
      ...productos.map((producto) =>
        this.prisma.producto.update({
          where: { id: producto.id },
          data: {
            stock: producto.stock.valor,
            stockReservado: producto.stockReservado.valor,
          },
        }),
      ),
      ...productos.flatMap((producto) => this.movimientosCreate(producto)),
    ]);
  }

  private movimientosCreate(producto: Producto) {
    const movimientos = producto.obtenerMovimientos();
    if (movimientos.length === 0) {
      return [];
    }
    return [
      this.prisma.movimientoInventario.createMany({
        data: movimientos.map((mov) => ({
          id: mov.id,
          productoId: mov.productoId,
          tipo: mov.tipo as TipoMovimientoDb,
          cantidad: mov.cantidad,
          motivo: mov.motivo,
          fecha: mov.fecha,
        })),
      }),
    ];
  }

  private aDatos(producto: Producto): Prisma.ProductoCreateInput {
    return {
      id: producto.id,
      nombre: producto.nombre,
      stock: producto.stock.valor,
      stockReservado: producto.stockReservado.valor,
    };
  }

  private aDominio(row: ProductoRow): Producto {
    return Producto.reconstituir({
      id: row.id,
      nombre: row.nombre,
      stock: new Cantidad(row.stock),
      stockReservado: new Cantidad(row.stockReservado),
    });
  }

  private aMovimientoDominio(row: MovimientoRow): MovimientoInventario {
    return MovimientoInventario.reconstituir({
      id: row.id,
      productoId: row.productoId,
      tipo: row.tipo as TipoMovimiento,
      cantidad: row.cantidad,
      motivo: row.motivo,
      fecha: row.fecha,
    });
  }
}
