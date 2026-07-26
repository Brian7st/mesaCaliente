import { Injectable } from '@nestjs/common';
import { EstadoMesaDb, Mesa as MesaRow, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { MesaRepository } from '../../../domain/ports/out/mesa.repository';
import { Mesa } from '../../../domain/model/mesa.aggregate';
import { NumeroMesa } from '../../../domain/model/numero-mesa.vo';
import { EstadoMesa } from '../../../domain/model/estado-mesa.vo';
import { NumeroMesaDuplicadoException } from '../../../domain/exceptions/mesa.exceptions';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

@Injectable()
export class MesaRepositoryPrisma implements MesaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Mesa | null> {
    const row = await this.prisma.mesa.findUnique({ where: { id } });
    return row ? this.aDominio(row) : null;
  }

  async listar(paginacion: ParametrosPaginacion): Promise<Pagina<Mesa>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.mesa.findMany({
        orderBy: { numero: 'asc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.mesa.count(),
    ]);
    return {
      items: rows.map((row) => this.aDominio(row)),
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }

  async guardar(mesa: Mesa): Promise<void> {
    const estado = mesa.estado as unknown as EstadoMesaDb;
    try {
      await this.prisma.mesa.upsert({
        where: { id: mesa.id },
        create: {
          id: mesa.id,
          numero: mesa.numero.valor,
          estado,
        },
        update: {
          estado,
        },
      });
    } catch (error) {
      // Traduce la violacion de unicidad de `numero` (P2002) a una excepcion
      // de dominio, para que el filtro global responda 400 en vez de 500.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new NumeroMesaDuplicadoException(mesa.numero.valor);
      }
      throw error;
    }
  }

  private aDominio(row: MesaRow): Mesa {
    return Mesa.reconstituir({
      id: row.id,
      numero: new NumeroMesa(row.numero),
      estado: row.estado as unknown as EstadoMesa,
    });
  }
}
