import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ConfirmarEntregaCommand } from './confirmar-entrega.command';
import { DomicilioRepository } from '../../../domain/ports/out/domicilio.repository';

@CommandHandler(ConfirmarEntregaCommand)
export class ConfirmarEntregaHandler
  implements ICommandHandler<ConfirmarEntregaCommand>
{
  constructor(
    @Inject('DomicilioRepository')
    private readonly repo: DomicilioRepository,
  ) {}

  async execute(command: ConfirmarEntregaCommand): Promise<void> {
    const domicilio = await this.repo.buscarPorId(command.domicilioId);
    if (!domicilio) {
      throw new NotFoundException('Domicilio no encontrado');
    }
    // El evento DomicilioEntregado lo persiste el repositorio en el Outbox.
    domicilio.confirmarEntrega();
    await this.repo.guardar(domicilio);
  }
}
