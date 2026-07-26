import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CrearProductoCommand } from './crear-producto.command';
import { ProductoRepository } from '../../../domain/ports/out/producto.repository';
import { Producto } from '../../../domain/model/producto.aggregate';
import { Cantidad } from '../../../domain/model/cantidad.vo';

@CommandHandler(CrearProductoCommand)
export class CrearProductoHandler
  implements ICommandHandler<CrearProductoCommand>
{
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
  ) {}

  async execute(command: CrearProductoCommand): Promise<void> {
    const producto = Producto.crear(
      command.productoId,
      command.nombre,
      new Cantidad(command.stockInicial),
    );
    await this.repo.guardar(producto);
  }
}
