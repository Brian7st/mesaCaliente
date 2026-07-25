import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AgregarItemCommand } from './agregar-item.command';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';
import { ItemPedido } from '../../../domain/model/item-pedido.entity';
import { Dinero } from '../../../domain/model/dinero.vo';

@CommandHandler(AgregarItemCommand)
export class AgregarItemHandler implements ICommandHandler<AgregarItemCommand> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AgregarItemCommand): Promise<void> {
    const pedido = await this.repo.buscarPorId(command.pedidoId);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const item = new ItemPedido(
      randomUUID(),
      command.productoId,
      command.cantidad,
      new Dinero(command.precioUnitario),
    );
    pedido.agregarItem(item);
    await this.repo.guardar(pedido);
    pedido.obtenerEventos().forEach((evento) => this.eventBus.publish(evento));
  }
}
