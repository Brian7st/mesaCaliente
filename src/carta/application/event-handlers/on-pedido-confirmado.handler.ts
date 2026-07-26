import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { PlatoRepository } from '../../domain/ports/out/plato.repository';
import { InsumosRequeridos } from '../../domain/events/insumos-requeridos.event';

/**
 * Reacciona a PedidoConfirmado: explota las recetas de los platos del pedido en
 * los insumos que requieren y emite InsumosRequeridos (lo consume Inventario).
 * Carta es la duena de las recetas; Inventario no las conoce. Unica importacion
 * cruzada: la clase del evento.
 */
@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler
  implements IEventHandler<PedidoConfirmado>
{
  constructor(
    @Inject('PlatoRepository') private readonly repo: PlatoRepository,
    private readonly outbox: OutboxService,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    const requeridos = new Map<string, number>();

    for (const item of event.items) {
      const plato = await this.repo.buscarPorId(item.platoId);
      if (!plato) {
        continue;
      }
      for (const linea of plato.receta) {
        const actual = requeridos.get(linea.insumoId) ?? 0;
        requeridos.set(linea.insumoId, actual + linea.cantidad * item.cantidad);
      }
    }

    const insumos = Array.from(requeridos.entries()).map(
      ([insumoId, cantidad]) => ({ insumoId, cantidad }),
    );
    await this.outbox.registrar([
      new InsumosRequeridos(event.pedidoId, insumos, new Date()),
    ]);
  }
}
