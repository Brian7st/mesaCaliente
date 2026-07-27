import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { CambiarDisponibilidadCommand } from './cambiar-disponibilidad.command';
import { PlatoRepository } from '../../../domain/ports/out/plato.repository';

@CommandHandler(CambiarDisponibilidadCommand)
export class CambiarDisponibilidadHandler
  implements ICommandHandler<CambiarDisponibilidadCommand>
{
  constructor(
    @Inject('PlatoRepository') private readonly repo: PlatoRepository,
  ) {}

  async execute(command: CambiarDisponibilidadCommand): Promise<void> {
    const plato = await this.repo.buscarPorId(command.platoId);
    if (!plato) {
      throw new NotFoundException('Plato no encontrado');
    }
    plato.cambiarDisponibilidad(command.disponible);
    await this.repo.guardar(plato);
  }
}
