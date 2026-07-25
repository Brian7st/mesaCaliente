import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ConfirmarPedidoCommand } from './confirmar-pedido.command';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';

@CommandHandler(ConfirmarPedidoCommand)
export class ConfirmarPedidoHandler
  implements ICommandHandler<ConfirmarPedidoCommand>
{
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmarPedidoCommand): Promise<void> {
    const pedido = await this.repo.buscarPorId(command.pedidoId);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    pedido.confirmar();
    await this.repo.guardar(pedido);
    pedido.obtenerEventos().forEach((evento) => this.eventBus.publish(evento));
  }
}
