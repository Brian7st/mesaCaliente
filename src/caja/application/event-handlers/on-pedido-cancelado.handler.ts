import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoCancelado } from '../../../pedidos/domain/events/pedido-cancelado.event';
import { CuentaRepository } from '../../domain/ports/out/cuenta.repository';
import { EstadoCuenta } from '../../domain/model/estado-cuenta.vo';

/**
 * Reacciona a PedidoCancelado: quita la linea de ese pedido de su cuenta (no se
 * cobra un pedido cancelado). Solo participa si la cuenta sigue ABIERTA.
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PedidoCancelado)
export class OnPedidoCanceladoHandler
  implements IEventHandler<PedidoCancelado>
{
  constructor(
    @Inject('CuentaRepository') private readonly repo: CuentaRepository,
  ) {}

  async handle(event: PedidoCancelado): Promise<void> {
    const cuenta = await this.repo.buscarPorPedidoId(event.pedidoId);
    if (!cuenta || cuenta.estado !== EstadoCuenta.ABIERTA) {
      return;
    }
    cuenta.quitarPedido(event.pedidoId);
    await this.repo.guardar(cuenta);
  }
}
