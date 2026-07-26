import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { MarcarItemPreparadoCommand } from './marcar-item-preparado.command';
import { OrdenCocinaRepository } from '../../../domain/ports/out/orden-cocina.repository';

@CommandHandler(MarcarItemPreparadoCommand)
export class MarcarItemPreparadoHandler
  implements ICommandHandler<MarcarItemPreparadoCommand>
{
  constructor(
    @Inject('OrdenCocinaRepository')
    private readonly repo: OrdenCocinaRepository,
  ) {}

  async execute(command: MarcarItemPreparadoCommand): Promise<void> {
    const orden = await this.repo.buscarPorId(command.ordenId);
    if (!orden) {
      throw new NotFoundException('Orden de cocina no encontrada');
    }
    orden.marcarItemPreparado(command.platoId);
    await this.repo.guardar(orden);
  }
}
