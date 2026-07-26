import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoListo } from '../../../cocina/domain/events/pedido-listo.event';
import { PedidoRepository } from '../../domain/ports/out/pedido.repository';
import { EstadoPedido } from '../../domain/model/estado-pedido.vo';

/**
 * Reacciona a PedidoListo (de Cocina): el pedido pasa a LISTO. Solo participa
 * si esta en EN_PREPARACION. Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PedidoListo)
export class OnPedidoListoHandler implements IEventHandler<PedidoListo> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  async handle(event: PedidoListo): Promise<void> {
    const pedido = await this.repo.buscarPorId(event.pedidoId);
    if (!pedido || pedido.estado !== EstadoPedido.EN_PREPARACION) {
      return;
    }
    pedido.marcarListo();
    await this.repo.guardar(pedido);
  }
}
