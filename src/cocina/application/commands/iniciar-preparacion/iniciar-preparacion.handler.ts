import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { IniciarPreparacionCommand } from './iniciar-preparacion.command';
import { OrdenCocinaRepository } from '../../../domain/ports/out/orden-cocina.repository';

@CommandHandler(IniciarPreparacionCommand)
export class IniciarPreparacionHandler
  implements ICommandHandler<IniciarPreparacionCommand>
{
  constructor(
    @Inject('OrdenCocinaRepository')
    private readonly repo: OrdenCocinaRepository,
  ) {}

  async execute(command: IniciarPreparacionCommand): Promise<void> {
    const orden = await this.repo.buscarPorId(command.ordenId);
    if (!orden) {
      throw new NotFoundException('Orden de cocina no encontrada');
    }
    orden.iniciarPreparacion();
    await this.repo.guardar(orden);
  }
}
