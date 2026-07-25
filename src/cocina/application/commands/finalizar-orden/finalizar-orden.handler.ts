import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { FinalizarOrdenCommand } from './finalizar-orden.command';
import { OrdenCocinaRepository } from '../../../domain/ports/out/orden-cocina.repository';

@CommandHandler(FinalizarOrdenCommand)
export class FinalizarOrdenHandler
  implements ICommandHandler<FinalizarOrdenCommand>
{
  constructor(
    @Inject('OrdenCocinaRepository')
    private readonly repo: OrdenCocinaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FinalizarOrdenCommand): Promise<void> {
    const orden = await this.repo.buscarPorId(command.ordenId);
    if (!orden) {
      throw new NotFoundException('Orden de cocina no encontrada');
    }
    orden.finalizar();
    await this.repo.guardar(orden);
    orden.obtenerEventos().forEach((evento) => this.eventBus.publish(evento));
  }
}
