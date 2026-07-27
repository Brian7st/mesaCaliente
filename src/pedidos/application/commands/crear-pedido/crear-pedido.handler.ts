import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CrearPedidoCommand } from './crear-pedido.command';
import { Pedido } from '../../../domain/model/pedido.aggregate';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';

@CommandHandler(CrearPedidoCommand)
export class CrearPedidoHandler implements ICommandHandler<CrearPedidoCommand> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  async execute(command: CrearPedidoCommand): Promise<void> {
    const pedido = Pedido.crear(
      command.pedidoId,
      command.mesaId,
      command.tipo,
      command.direccion,
      command.observacion,
    );
    await this.repo.guardar(pedido);
  }
}
