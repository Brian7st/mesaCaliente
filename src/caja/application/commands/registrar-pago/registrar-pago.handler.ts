import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RegistrarPagoCommand } from './registrar-pago.command';
import { CuentaRepository } from '../../../domain/ports/out/cuenta.repository';

@CommandHandler(RegistrarPagoCommand)
export class RegistrarPagoHandler
  implements ICommandHandler<RegistrarPagoCommand>
{
  constructor(
    @Inject('CuentaRepository') private readonly repo: CuentaRepository,
  ) {}

  async execute(command: RegistrarPagoCommand): Promise<void> {
    const cuenta = await this.repo.buscarPorId(command.cuentaId);
    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    // El evento PagoRegistrado lo persiste el repositorio en el Outbox.
    cuenta.pagar();
    await this.repo.guardar(cuenta);
  }
}
