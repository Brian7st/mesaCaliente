import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { StockReservado } from '../../../inventario/domain/events/stock-reservado.event';
import { PedidoRepository } from '../../domain/ports/out/pedido.repository';

/**
 * Reaccion del Saga: cuando Inventario reservo el stock con exito, el pedido
 * avanza a EN_PREPARACION. Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(StockReservado)
export class OnStockReservadoHandler implements IEventHandler<StockReservado> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  async handle(event: StockReservado): Promise<void> {
    const pedido = await this.repo.buscarPorId(event.pedidoId);
    if (!pedido) {
      return;
    }
    pedido.iniciarPreparacion();
    await this.repo.guardar(pedido);
  }
}
