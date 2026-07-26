import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { RegistrarSalidaCommand } from './registrar-salida.command';
import { ProductoRepository } from '../../../domain/ports/out/producto.repository';
import { Cantidad } from '../../../domain/model/cantidad.vo';

@CommandHandler(RegistrarSalidaCommand)
export class RegistrarSalidaHandler
  implements ICommandHandler<RegistrarSalidaCommand>
{
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
  ) {}

  async execute(command: RegistrarSalidaCommand): Promise<void> {
    const producto = await this.repo.buscarPorId(command.productoId);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }
    producto.registrarSalida(new Cantidad(command.cantidad), command.motivo);
    await this.repo.guardar(producto);
  }
}
