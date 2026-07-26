import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { CuentaRepository } from '../../domain/ports/out/cuenta.repository';
import { Cuenta } from '../../domain/model/cuenta.aggregate';
import { Dinero } from '../../domain/model/dinero.vo';

/**
 * Reacciona a PedidoConfirmado: agrega el pedido a la cuenta ABIERTA de su mesa
 * (o abre una nueva). Los pedidos sin mesa (domicilio) abren su propia cuenta.
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler
  implements IEventHandler<PedidoConfirmado>
{
  constructor(
    @Inject('CuentaRepository') private readonly repo: CuentaRepository,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    const total = new Dinero(event.total.monto);
    let cuenta: Cuenta | null = null;
    if (event.mesaId) {
      cuenta = await this.repo.buscarAbiertaPorMesa(event.mesaId);
    }
    if (!cuenta) {
      cuenta = Cuenta.abrir(randomUUID(), event.mesaId);
    }
    cuenta.agregarPedido(event.pedidoId, total);
    await this.repo.guardar(cuenta);
  }
}
