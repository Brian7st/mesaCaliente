import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../prisma/prisma.service';
import { reconstruirEvento } from './outbox.registry';

/**
 * Publica los eventos pendientes del Outbox en el EventBus, en orden de
 * creacion y de a un ciclo por vez. Al procesar los eventos secuencialmente,
 * las reacciones de un evento (que a su vez generan nuevos eventos en el Outbox)
 * se despachan en el ciclo siguiente, dando un orden determinista a la
 * coreografia (ej. la orden de cocina ya existe cuando se despacha la
 * cancelacion del pedido).
 */
@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private temporizador?: NodeJS.Timeout;
  private procesando = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  onModuleInit(): void {
    this.temporizador = setInterval(() => {
      void this.despachar();
    }, 500);
  }

  onModuleDestroy(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
  }

  /** Despacha un lote de eventos pendientes. Devuelve cuantos publico. */
  async despachar(): Promise<number> {
    if (this.procesando) {
      return 0;
    }
    this.procesando = true;
    try {
      const pendientes = await this.prisma.outboxEvent.findMany({
        where: { publicado: false },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      for (const fila of pendientes) {
        const evento = reconstruirEvento(fila.eventType, fila.payload);
        if (evento) {
          this.eventBus.publish(evento);
        } else {
          this.logger.warn(`Tipo de evento no registrado: ${fila.eventType}`);
        }
        await this.prisma.outboxEvent.update({
          where: { id: fila.id },
          data: { publicado: true },
        });
      }

      return pendientes.length;
    } finally {
      this.procesando = false;
    }
  }
}
