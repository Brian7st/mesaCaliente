import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { DomicilioRepository } from '../../domain/ports/out/domicilio.repository';
import { Domicilio } from '../../domain/model/domicilio.aggregate';
import { Direccion } from '../../domain/model/direccion.vo';

/**
 * Reacciona a PedidoConfirmado creando el Domicilio SOLO si el pedido es de
 * tipo DOMICILIO, usando la direccion que viaja en el evento. Unica importacion
 * cruzada: la clase del evento.
 */
@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler
  implements IEventHandler<PedidoConfirmado>
{
  constructor(
    @Inject('DomicilioRepository')
    private readonly repo: DomicilioRepository,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    if (event.tipo !== 'DOMICILIO' || !event.direccion) {
      return;
    }
    const direccion = new Direccion(
      event.direccion.calle,
      event.direccion.ciudad,
      event.direccion.referencia,
    );
    const domicilio = Domicilio.crear(
      randomUUID(),
      event.pedidoId,
      direccion,
    );
    await this.repo.guardar(domicilio);
  }
}
