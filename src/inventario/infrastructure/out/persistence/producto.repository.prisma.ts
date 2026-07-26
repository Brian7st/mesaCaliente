import { Injectable } from '@nestjs/common';
import { Producto as ProductoRow } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ProductoRepository } from '../../../domain/ports/out/producto.repository';
import { Producto } from '../../../domain/model/producto.aggregate';
import { Cantidad } from '../../../domain/model/cantidad.vo';

@Injectable()
export class ProductoRepositoryPrisma implements ProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Producto | null> {
    const row = await this.prisma.producto.findUnique({ where: { id } });
    return row ? this.aDominio(row) : null;
  }

  async listar(): Promise<Producto[]> {
    const rows = await this.prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
    });
    return rows.map((row) => this.aDominio(row));
  }

  async guardar(producto: Producto): Promise<void> {
    await this.prisma.producto.upsert({
      where: { id: producto.id },
      create: this.aDatos(producto),
      update: {
        stock: producto.stock.valor,
        stockReservado: producto.stockReservado.valor,
      },
    });
  }

  async guardarVarios(productos: Producto[]): Promise<void> {
    // Persistencia atomica de la reserva de todos los productos (patron Saga).
    await this.prisma.$transaction(
      productos.map((producto) =>
        this.prisma.producto.update({
          where: { id: producto.id },
          data: {
            stock: producto.stock.valor,
            stockReservado: producto.stockReservado.valor,
          },
        }),
      ),
    );
  }

  private aDatos(producto: Producto) {
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
}
