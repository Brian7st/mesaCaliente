import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ReservaStockFallida } from '../../../inventario/domain/events/reserva-stock-fallida.event';
import { PedidoRepository } from '../../domain/ports/out/pedido.repository';

/**
 * Compensacion del Saga: cuando Inventario no pudo reservar el stock, el pedido
 * se cancela con el motivo del fallo. El evento PedidoCancelado resultante lo
 * persiste el repositorio en el Outbox. Unica importacion cruzada: la clase del
 * evento.
 */
@EventsHandler(ReservaStockFallida)
export class OnReservaStockFallidaHandler
  implements IEventHandler<ReservaStockFallida>
{
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  async handle(event: ReservaStockFallida): Promise<void> {
    const pedido = await this.repo.buscarPorId(event.pedidoId);
    if (!pedido) {
      return;
    }
    pedido.cancelar(event.motivo);
    await this.repo.guardar(pedido);
  }
}
