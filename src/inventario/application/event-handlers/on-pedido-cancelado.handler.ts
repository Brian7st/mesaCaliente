import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoCancelado } from '../../../pedidos/domain/events/pedido-cancelado.event';
import { ProductoRepository } from '../../domain/ports/out/producto.repository';
import { ReservaInsumoRepository } from '../../domain/ports/out/reserva-insumo.repository';
import { Producto } from '../../domain/model/producto.aggregate';
import { Cantidad } from '../../domain/model/cantidad.vo';

/**
 * Compensacion del ciclo de reserva. Cuando un pedido se cancela, Inventario
 * libera las reservas de sus insumos: baja solo el reservado (el stock fisico
 * no cambia), generando un movimiento LIBERACION por cada insumo. Luego borra el
 * registro de reserva. Si el pedido no tenia reservas (p. ej. la reserva ya
 * habia fallado), no hace nada (idempotente).
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PedidoCancelado)
export class OnPedidoCanceladoHandler
  implements IEventHandler<PedidoCancelado>
{
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
    @Inject('ReservaInsumoRepository')
    private readonly reservas: ReservaInsumoRepository,
  ) {}

  async handle(event: PedidoCancelado): Promise<void> {
    const lineas = await this.reservas.buscarPorPedido(event.pedidoId);
    if (lineas.length === 0) {
      return;
    }

    const productos: Producto[] = [];
    for (const linea of lineas) {
      const producto = await this.repo.buscarPorId(linea.insumoId);
      if (!producto) {
        continue;
      }
      producto.liberarReserva(new Cantidad(linea.cantidad), event.pedidoId);
      productos.push(producto);
    }

    await this.repo.guardarVarios(productos);
    await this.reservas.eliminarPorPedido(event.pedidoId);
  }
}
