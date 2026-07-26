import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PlatoCreado } from '../../../carta/domain/events/plato-creado.event';
import { CatalogoPlatosRepository } from '../../domain/ports/out/catalogo-platos.repository';

/**
 * Alimenta la proyeccion local del catalogo cuando Carta crea un plato.
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PlatoCreado)
export class OnPlatoCreadoHandler implements IEventHandler<PlatoCreado> {
  constructor(
    @Inject('CatalogoPlatosRepository')
    private readonly catalogo: CatalogoPlatosRepository,
  ) {}

  async handle(event: PlatoCreado): Promise<void> {
    await this.catalogo.guardarPlato({
      platoId: event.platoId,
      nombre: event.nombre,
      precio: event.precio.monto,
      disponible: event.disponible,
    });
  }
}
