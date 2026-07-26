import { Injectable } from '@nestjs/common';
import {
  EstadoCuentaDb,
  Cuenta as CuentaRow,
  LineaCuenta as LineaCuentaRow,
} from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { aFilaOutbox } from '../../../../shared/infrastructure/outbox/outbox.mapper';
import { CuentaRepository } from '../../../domain/ports/out/cuenta.repository';
import { Cuenta } from '../../../domain/model/cuenta.aggregate';
import { LineaCuenta } from '../../../domain/model/linea-cuenta.entity';
import { Dinero } from '../../../domain/model/dinero.vo';
import { EstadoCuenta } from '../../../domain/model/estado-cuenta.vo';

type CuentaConLineas = CuentaRow & { lineas: LineaCuentaRow[] };

@Injectable()
export class CuentaRepositoryPrisma implements CuentaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(id: string): Promise<Cuenta | null> {
    const row = await this.prisma.cuenta.findUnique({
      where: { id },
      include: { lineas: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async buscarAbiertaPorMesa(mesaId: string): Promise<Cuenta | null> {
    const row = await this.prisma.cuenta.findFirst({
      where: { mesaId, estado: EstadoCuentaDb.ABIERTA },
      include: { lineas: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async buscarPorPedidoId(pedidoId: string): Promise<Cuenta | null> {
    const row = await this.prisma.cuenta.findFirst({
      where: { lineas: { some: { pedidoId } } },
      include: { lineas: true },
    });
    return row ? this.aDominio(row) : null;
  }

  async listar(): Promise<Cuenta[]> {
    const rows = await this.prisma.cuenta.findMany({
      include: { lineas: true },
    });
    return rows.map((row) => this.aDominio(row));
  }

  async guardar(cuenta: Cuenta): Promise<void> {
    const estado = cuenta.estado as unknown as EstadoCuentaDb;
    const eventos = cuenta.obtenerEventos();
    await this.prisma.$transaction([
      this.prisma.cuenta.upsert({
        where: { id: cuenta.id },
        create: { id: cuenta.id, mesaId: cuenta.mesaId, estado },
        update: { estado },
      }),
      this.prisma.lineaCuenta.deleteMany({ where: { cuentaId: cuenta.id } }),
      this.prisma.lineaCuenta.createMany({
        data: cuenta.lineas.map((linea) => ({
          cuentaId: cuenta.id,
          pedidoId: linea.pedidoId,
          total: linea.total.monto,
        })),
      }),
      ...(eventos.length > 0
        ? [this.prisma.outboxEvent.createMany({ data: eventos.map(aFilaOutbox) })]
        : []),
    ]);
  }

  private aDominio(row: CuentaConLineas): Cuenta {
    return Cuenta.reconstituir({
      id: row.id,
      mesaId: row.mesaId,
      estado: row.estado as unknown as EstadoCuenta,
      lineas: row.lineas.map(
        (linea) => new LineaCuenta(linea.pedidoId, new Dinero(linea.total)),
      ),
    });
  }
}
