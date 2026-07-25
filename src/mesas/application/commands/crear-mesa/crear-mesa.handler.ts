import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CrearMesaCommand } from './crear-mesa.command';
import { MesaRepository } from '../../../domain/ports/out/mesa.repository';
import { Mesa } from '../../../domain/model/mesa.aggregate';
import { NumeroMesa } from '../../../domain/model/numero-mesa.vo';

@CommandHandler(CrearMesaCommand)
export class CrearMesaHandler implements ICommandHandler<CrearMesaCommand> {
  constructor(
    @Inject('MesaRepository') private readonly repo: MesaRepository,
  ) {}

  async execute(command: CrearMesaCommand): Promise<void> {
    const mesa = Mesa.crear(command.mesaId, new NumeroMesa(command.numero));
    await this.repo.guardar(mesa);
  }
}
