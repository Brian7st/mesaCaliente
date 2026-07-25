import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CrearPedidoCommand } from './crear-pedido.command';
import { Pedido } from '../../../domain/model/pedido.aggregate';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';

@CommandHandler(CrearPedidoCommand)
export class CrearPedidoHandler implements ICommandHandler<CrearPedidoCommand> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CrearPedidoCommand): Promise<void> {
    const pedido = Pedido.crear(command.pedidoId, command.mesaId, command.tipo);
    await this.repo.guardar(pedido);
    pedido.obtenerEventos().forEach((evento) => this.eventBus.publish(evento));
  }
}
