import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ReponerStockCommand } from './reponer-stock.command';
import { ProductoRepository } from '../../../domain/ports/out/producto.repository';
import { Cantidad } from '../../../domain/model/cantidad.vo';

@CommandHandler(ReponerStockCommand)
export class ReponerStockHandler
  implements ICommandHandler<ReponerStockCommand>
{
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
  ) {}

  async execute(command: ReponerStockCommand): Promise<void> {
    const producto = await this.repo.buscarPorId(command.productoId);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }
    producto.reponer(new Cantidad(command.cantidad));
    await this.repo.guardar(producto);
  }
}
