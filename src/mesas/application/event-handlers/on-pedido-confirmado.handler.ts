import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { MesaRepository } from '../../domain/ports/out/mesa.repository';

/**
 * Reacciona a PedidoConfirmado (publicado por Pedidos): si el pedido tiene
 * mesa asociada, la ocupa. Unica importacion permitida entre contextos: la
 * clase del evento (CLAUDE.md 3.4 / 6.2).
 */
@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler
  implements IEventHandler<PedidoConfirmado>
{
  constructor(
    @Inject('MesaRepository') private readonly repo: MesaRepository,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    // Este contexto solo participa si el pedido tiene mesa (no es domicilio).
    if (!event.mesaId) {
      return;
    }
    const mesa = await this.repo.buscarPorId(event.mesaId);
    if (!mesa) {
      return;
    }
    // La invariante (no ocupar una mesa ya ocupada) vive en el Aggregate.
    mesa.ocupar();
    await this.repo.guardar(mesa);
  }
}
