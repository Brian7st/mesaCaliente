import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { IniciarEntregaCommand } from './iniciar-entrega.command';
import { DomicilioRepository } from '../../../domain/ports/out/domicilio.repository';

@CommandHandler(IniciarEntregaCommand)
export class IniciarEntregaHandler
  implements ICommandHandler<IniciarEntregaCommand>
{
  constructor(
    @Inject('DomicilioRepository')
    private readonly repo: DomicilioRepository,
  ) {}

  async execute(command: IniciarEntregaCommand): Promise<void> {
    const domicilio = await this.repo.buscarPorId(command.domicilioId);
    if (!domicilio) {
      throw new NotFoundException('Domicilio no encontrado');
    }
    domicilio.iniciarEntrega();
    await this.repo.guardar(domicilio);
  }
}
