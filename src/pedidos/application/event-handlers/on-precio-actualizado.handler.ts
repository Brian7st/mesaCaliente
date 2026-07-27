import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PrecioActualizado } from '../../../carta/domain/events/precio-actualizado.event';
import { CatalogoPlatosRepository } from '../../domain/ports/out/catalogo-platos.repository';

@EventsHandler(PrecioActualizado)
export class OnPrecioActualizadoHandler
  implements IEventHandler<PrecioActualizado>
{
  constructor(
    @Inject('CatalogoPlatosRepository')
    private readonly catalogo: CatalogoPlatosRepository,
  ) {}

  async handle(event: PrecioActualizado): Promise<void> {
    await this.catalogo.actualizarPrecio(event.platoId, event.precio.monto);
  }
}
