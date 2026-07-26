import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  ReservaInsumo,
  ReservaInsumoRepository,
} from '../../../domain/ports/out/reserva-insumo.repository';

@Injectable()
export class ReservaInsumoRepositoryPrisma implements ReservaInsumoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(pedidoId: string, reservas: ReservaInsumo[]): Promise<void> {
    if (reservas.length === 0) {
      return;
    }
    await this.prisma.reservaInsumo.createMany({
      data: reservas.map((reserva) => ({
        pedidoId,
        insumoId: reserva.insumoId,
        cantidad: reserva.cantidad,
      })),
    });
  }

  async buscarPorPedido(pedidoId: string): Promise<ReservaInsumo[]> {
    const rows = await this.prisma.reservaInsumo.findMany({
      where: { pedidoId },
    });
    return rows.map((row) => ({
      insumoId: row.insumoId,
      cantidad: row.cantidad,
    }));
  }

  async eliminarPorPedido(pedidoId: string): Promise<void> {
    await this.prisma.reservaInsumo.deleteMany({ where: { pedidoId } });
  }
}
