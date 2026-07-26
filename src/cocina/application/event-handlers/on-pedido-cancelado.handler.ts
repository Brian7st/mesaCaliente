import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoCancelado } from '../../../pedidos/domain/events/pedido-cancelado.event';
import { OrdenCocinaRepository } from '../../domain/ports/out/orden-cocina.repository';
import { EstadoOrdenCocina } from '../../domain/model/estado-orden-cocina.vo';

/**
 * Reacciona a PedidoCancelado (de Pedidos): descarta la OrdenCocina asociada
 * si todavia no fue preparada. Cierra el cabo suelto del Saga cuando Cocina ya
 * habia creado la orden antes de que la reserva de stock fallara.
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PedidoCancelado)
export class OnPedidoCanceladoHandler
  implements IEventHandler<PedidoCancelado>
{
  constructor(
    @Inject('OrdenCocinaRepository')
    private readonly repo: OrdenCocinaRepository,
  ) {}

  async handle(event: PedidoCancelado): Promise<void> {
    const orden = await this.repo.buscarPorPedidoId(event.pedidoId);
    if (!orden) {
      return;
    }
    // Si ya esta LISTA o DESCARTADA, este contexto no participa.
    if (
      orden.estado === EstadoOrdenCocina.LISTA ||
      orden.estado === EstadoOrdenCocina.DESCARTADA
    ) {
      return;
    }
    orden.descartar();
    await this.repo.guardar(orden);
  }
}
