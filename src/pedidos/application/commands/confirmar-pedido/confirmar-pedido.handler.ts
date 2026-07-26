import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ConfirmarPedidoCommand } from './confirmar-pedido.command';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';

@CommandHandler(ConfirmarPedidoCommand)
export class ConfirmarPedidoHandler
  implements ICommandHandler<ConfirmarPedidoCommand>
{
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  async execute(command: ConfirmarPedidoCommand): Promise<void> {
    const pedido = await this.repo.buscarPorId(command.pedidoId);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    // El evento PedidoConfirmado lo persiste el repositorio en el Outbox
    // (dentro de la misma transaccion) y lo publica el dispatcher.
    pedido.confirmar();
    await this.repo.guardar(pedido);
  }
}
