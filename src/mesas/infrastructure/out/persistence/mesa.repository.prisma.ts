import { Injectable } from '@nestjs/common';
import { EstadoMesaDb, Mesa as MesaRow } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { MesaRepository } from '../../../domain/ports/out/mesa.repository';
import { Mesa } from '../../../domain/model/mesa.aggregate';
import { NumeroMesa } from '../../../domain/model/numero-mesa.vo';
import { EstadoMesa } from '../../../domain/model/estado-mesa.vo';

@Injectable()
export class MesaRepositoryPrisma implements MesaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Mesa | null> {
    const row = await this.prisma.mesa.findUnique({ where: { id } });
    return row ? this.aDominio(row) : null;
  }

  async listar(): Promise<Mesa[]> {
    const rows = await this.prisma.mesa.findMany({ orderBy: { numero: 'asc' } });
    return rows.map((row) => this.aDominio(row));
  }

  async guardar(mesa: Mesa): Promise<void> {
    const estado = mesa.estado as unknown as EstadoMesaDb;
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
  }

  private aDominio(row: MesaRow): Mesa {
    return Mesa.reconstituir({
      id: row.id,
      numero: new NumeroMesa(row.numero),
      estado: row.estado as unknown as EstadoMesa,
    });
  }
}
