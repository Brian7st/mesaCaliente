import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AgregarItemCommand } from './agregar-item.command';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';
import { CatalogoPlatosRepository } from '../../../domain/ports/out/catalogo-platos.repository';
import { ItemPedido } from '../../../domain/model/item-pedido.entity';
import { Dinero } from '../../../domain/model/dinero.vo';
import {
  PlatoNoDisponibleException,
  PlatoNoEncontradoException,
} from '../../../domain/exceptions/plato.exceptions';

@CommandHandler(AgregarItemCommand)
export class AgregarItemHandler implements ICommandHandler<AgregarItemCommand> {
  constructor(
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
    @Inject('CatalogoPlatosRepository')
    private readonly catalogo: CatalogoPlatosRepository,
  ) {}

  async execute(command: AgregarItemCommand): Promise<void> {
    const pedido = await this.repo.buscarPorId(command.pedidoId);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // El precio lo duena el sistema: se toma (snapshot) de la proyeccion local
    // del catalogo de Carta, nunca del request.
    const plato = await this.catalogo.buscarPorId(command.platoId);
    if (!plato) {
      throw new PlatoNoEncontradoException(command.platoId);
    }
    if (!plato.disponible) {
      throw new PlatoNoDisponibleException(command.platoId);
    }

    const item = new ItemPedido(
      randomUUID(),
      command.platoId,
      command.cantidad,
      new Dinero(plato.precio),
      command.observacion,
    );
    pedido.agregarItem(item);
    await this.repo.guardar(pedido);
  }
}
