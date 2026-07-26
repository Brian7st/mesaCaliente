import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CrearPlatoCommand } from './crear-plato.command';
import { PlatoRepository } from '../../../domain/ports/out/plato.repository';
import { Plato } from '../../../domain/model/plato.aggregate';
import { Dinero } from '../../../domain/model/dinero.vo';

@CommandHandler(CrearPlatoCommand)
export class CrearPlatoHandler implements ICommandHandler<CrearPlatoCommand> {
  constructor(
    @Inject('PlatoRepository') private readonly repo: PlatoRepository,
  ) {}

  async execute(command: CrearPlatoCommand): Promise<void> {
    const plato = Plato.crear(
      command.platoId,
      command.nombre,
      new Dinero(command.precio),
      command.categoria,
    );
    await this.repo.guardar(plato);
  }
}
