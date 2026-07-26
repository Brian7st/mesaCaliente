import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DefinirRecetaCommand } from './definir-receta.command';
import { PlatoRepository } from '../../../domain/ports/out/plato.repository';
import { LineaReceta } from '../../../domain/model/linea-receta.entity';

@CommandHandler(DefinirRecetaCommand)
export class DefinirRecetaHandler
  implements ICommandHandler<DefinirRecetaCommand>
{
  constructor(
    @Inject('PlatoRepository') private readonly repo: PlatoRepository,
  ) {}

  async execute(command: DefinirRecetaCommand): Promise<void> {
    const plato = await this.repo.buscarPorId(command.platoId);
    if (!plato) {
      throw new NotFoundException('Plato no encontrado');
    }
    plato.definirReceta(
      command.receta.map((l) => new LineaReceta(l.insumoId, l.cantidad)),
    );
    await this.repo.guardar(plato);
  }
}
