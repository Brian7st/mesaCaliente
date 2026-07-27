import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ActualizarPrecioCommand } from './actualizar-precio.command';
import { PlatoRepository } from '../../../domain/ports/out/plato.repository';
import { Dinero } from '../../../domain/model/dinero.vo';

@CommandHandler(ActualizarPrecioCommand)
export class ActualizarPrecioHandler
  implements ICommandHandler<ActualizarPrecioCommand>
{
  constructor(
    @Inject('PlatoRepository') private readonly repo: PlatoRepository,
  ) {}

  async execute(command: ActualizarPrecioCommand): Promise<void> {
    const plato = await this.repo.buscarPorId(command.platoId);
    if (!plato) {
      throw new NotFoundException('Plato no encontrado');
    }
    plato.actualizarPrecio(new Dinero(command.precio));
    await this.repo.guardar(plato);
  }
}
