import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PagoRegistrado } from '../../../caja/domain/events/pago-registrado.event';
import { MesaRepository } from '../../domain/ports/out/mesa.repository';
import { EstadoMesa } from '../../domain/model/estado-mesa.vo';

/**
 * Reacciona a PagoRegistrado (de Caja): libera la mesa de la cuenta pagada, si
 * tenia mesa y sigue OCUPADA. Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PagoRegistrado)
export class OnPagoRegistradoHandler implements IEventHandler<PagoRegistrado> {
  constructor(
    @Inject('MesaRepository') private readonly repo: MesaRepository,
  ) {}

  async handle(event: PagoRegistrado): Promise<void> {
    if (!event.mesaId) {
      return;
    }
    const mesa = await this.repo.buscarPorId(event.mesaId);
    if (!mesa || mesa.estado !== EstadoMesa.OCUPADA) {
      return;
    }
    mesa.liberar();
    await this.repo.guardar(mesa);
  }
}
