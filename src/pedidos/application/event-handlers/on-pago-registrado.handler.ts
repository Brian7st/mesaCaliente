import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PagoRegistrado } from '../../../caja/domain/events/pago-registrado.event';
import { PedidoRepository } from '../../domain/ports/out/pedido.repository';
import { EstadoPedido } from '../../domain/model/estado-pedido.vo';

/**
 * Reacciona a PagoRegistrado (de Caja): marca como PAGADO cada pedido de la
 * cuenta que ya este LISTO (best-effort: los que aun no lo esten se ignoran).
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PagoRegistrado)
export class OnPagoRegistradoHandler implements IEventHandler<PagoRegistrado> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  async handle(event: PagoRegistrado): Promise<void> {
    for (const pedidoId of event.pedidoIds) {
      const pedido = await this.repo.buscarPorId(pedidoId);
      if (!pedido || pedido.estado !== EstadoPedido.LISTO) {
        continue;
      }
      pedido.marcarPagado();
      await this.repo.guardar(pedido);
    }
  }
}
