import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { LiberarMesaCommand } from './liberar-mesa.command';
import { MesaRepository } from '../../../domain/ports/out/mesa.repository';

@CommandHandler(LiberarMesaCommand)
export class LiberarMesaHandler implements ICommandHandler<LiberarMesaCommand> {
  constructor(
    @Inject('MesaRepository') private readonly repo: MesaRepository,
  ) {}

  async execute(command: LiberarMesaCommand): Promise<void> {
    const mesa = await this.repo.buscarPorId(command.mesaId);
    if (!mesa) {
      throw new NotFoundException('Mesa no encontrada');
    }
    mesa.liberar();
    await this.repo.guardar(mesa);
  }
}
