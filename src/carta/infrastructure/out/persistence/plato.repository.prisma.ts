import { Injectable } from '@nestjs/common';
import {
  CategoriaPlatoDb,
  Plato as PlatoRow,
  LineaReceta as LineaRecetaRow,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { aFilaOutbox } from '../../../../shared/infrastructure/outbox/outbox.mapper';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';
import { PlatoRepository } from '../../../domain/ports/out/plato.repository';
import { Plato } from '../../../domain/model/plato.aggregate';
import { LineaReceta } from '../../../domain/model/linea-receta.entity';
import { Dinero } from '../../../domain/model/dinero.vo';
import { CategoriaPlato } from '../../../domain/model/categoria-plato.vo';

type PlatoConReceta = PlatoRow & { receta: LineaRecetaRow[] };

@Injectable()
export class PlatoRepositoryPrisma implements PlatoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Plato | null> {
    const row = await this.prisma.plato.findUnique({
      where: { id },
      include: { receta: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async listar(paginacion: ParametrosPaginacion): Promise<Pagina<Plato>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.plato.findMany({
        include: { receta: true },
        orderBy: { nombre: 'asc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.plato.count(),
    ]);
    return {
      items: rows.map((row) => this.aDominio(row)),
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }

  async guardar(plato: Plato): Promise<void> {
    const categoria = plato.categoria as unknown as CategoriaPlatoDb;
    const eventos = plato.obtenerEventos();
    await this.prisma.$transaction([
      this.prisma.plato.upsert({
        where: { id: plato.id },
        create: {
          id: plato.id,
          nombre: plato.nombre,
          precio: plato.precio.monto,
          categoria,
          disponible: plato.disponible,
        },
        update: {
          precio: plato.precio.monto,
          disponible: plato.disponible,
        },
      }),
      this.prisma.lineaReceta.deleteMany({ where: { platoId: plato.id } }),
      this.prisma.lineaReceta.createMany({
        data: plato.receta.map((linea) => ({
          platoId: plato.id,
          insumoId: linea.insumoId,
          cantidad: linea.cantidad,
        })),
      }),
      ...(eventos.length > 0
        ? [this.prisma.outboxEvent.createMany({ data: eventos.map(aFilaOutbox) })]
        : []),
    ]);
  }

  private aDominio(row: PlatoConReceta): Plato {
    return Plato.reconstituir({
      id: row.id,
      nombre: row.nombre,
      precio: new Dinero(row.precio),
      categoria: row.categoria as unknown as CategoriaPlato,
      disponible: row.disponible,
      receta: row.receta.map(
        (linea) => new LineaReceta(linea.insumoId, linea.cantidad),
      ),
    });
  }
}
