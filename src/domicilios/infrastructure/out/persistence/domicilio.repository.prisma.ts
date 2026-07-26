import { Injectable } from '@nestjs/common';
import {
  EstadoDomicilioDb,
  Domicilio as DomicilioRow,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { aFilaOutbox } from '../../../../shared/infrastructure/outbox/outbox.mapper';
import { DomicilioRepository } from '../../../domain/ports/out/domicilio.repository';
import { Domicilio } from '../../../domain/model/domicilio.aggregate';
import { Direccion } from '../../../domain/model/direccion.vo';
import { EstadoDomicilio } from '../../../domain/model/estado-domicilio.vo';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

@Injectable()
export class DomicilioRepositoryPrisma implements DomicilioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Domicilio | null> {
    const row = await this.prisma.domicilio.findUnique({ where: { id } });
    return row ? this.aDominio(row) : null;
  }

  async listar(paginacion: ParametrosPaginacion): Promise<Pagina<Domicilio>> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.domicilio.findMany({
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.domicilio.count(),
    ]);
    return {
      items: rows.map((row) => this.aDominio(row)),
      total,
      page: paginacion.page,
      limit: paginacion.limit,
    };
  }

  async guardar(domicilio: Domicilio): Promise<void> {
    const estado = domicilio.estado as unknown as EstadoDomicilioDb;
    const eventos = domicilio.obtenerEventos();
    await this.prisma.$transaction([
      this.prisma.domicilio.upsert({
        where: { id: domicilio.id },
        create: {
          id: domicilio.id,
          pedidoId: domicilio.pedidoId,
          calle: domicilio.direccion.calle,
          ciudad: domicilio.direccion.ciudad,
          referencia: domicilio.direccion.referencia ?? null,
          estado,
        },
        update: { estado },
      }),
      ...(eventos.length > 0
        ? [this.prisma.outboxEvent.createMany({ data: eventos.map(aFilaOutbox) })]
        : []),
    ]);
  }

  private aDominio(row: DomicilioRow): Domicilio {
    return Domicilio.reconstituir({
      id: row.id,
      pedidoId: row.pedidoId,
      direccion: new Direccion(
        row.calle,
        row.ciudad,
        row.referencia ?? undefined,
      ),
      estado: row.estado as unknown as EstadoDomicilio,
    });
  }
}
