import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { aFilaOutbox } from './outbox.mapper';

/**
 * Registra Domain Events en el Outbox de forma independiente (sin un Aggregate
 * asociado que se persista en la misma transaccion). Lo usan las reacciones que
 * emiten eventos sin guardar un Aggregate propio (ej. la Saga de Inventario).
 */
@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(eventos: object[]): Promise<void> {
    if (eventos.length === 0) {
      return;
    }
    await this.prisma.outboxEvent.createMany({
      data: eventos.map(aFilaOutbox),
    });
  }
}
