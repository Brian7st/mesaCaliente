import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DisponibilidadCambiada } from '../../../carta/domain/events/disponibilidad-cambiada.event';
import { CatalogoPlatosRepository } from '../../domain/ports/out/catalogo-platos.repository';

@EventsHandler(DisponibilidadCambiada)
export class OnDisponibilidadCambiadaHandler
  implements IEventHandler<DisponibilidadCambiada>
{
  constructor(
    @Inject('CatalogoPlatosRepository')
    private readonly catalogo: CatalogoPlatosRepository,
  ) {}

  async handle(event: DisponibilidadCambiada): Promise<void> {
    await this.catalogo.actualizarDisponibilidad(
      event.platoId,
      event.disponible,
    );
  }
}
