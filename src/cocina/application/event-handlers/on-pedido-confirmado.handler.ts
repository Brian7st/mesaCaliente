import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { OrdenCocinaRepository } from '../../domain/ports/out/orden-cocina.repository';
import { OrdenCocina } from '../../domain/model/orden-cocina.aggregate';

/**
 * Reacciona a PedidoConfirmado (de Pedidos) creando la OrdenCocina en
 * PENDIENTE con los items del evento. Unica importacion cruzada permitida:
 * la clase del evento.
 */
@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler
  implements IEventHandler<PedidoConfirmado>
{
  constructor(
    @Inject('OrdenCocinaRepository')
    private readonly repo: OrdenCocinaRepository,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    const orden = OrdenCocina.crear(
      randomUUID(),
      event.pedidoId,
      event.items,
    );
    await this.repo.guardar(orden);
  }
}
