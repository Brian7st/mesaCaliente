import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoListo } from '../../../cocina/domain/events/pedido-listo.event';
import { ProductoRepository } from '../../domain/ports/out/producto.repository';
import { ReservaInsumoRepository } from '../../domain/ports/out/reserva-insumo.repository';
import { Producto } from '../../domain/model/producto.aggregate';
import { Cantidad } from '../../domain/model/cantidad.vo';

/**
 * Cierre del ciclo de reserva. Cuando el pedido queda LISTO (evento emitido por
 * Cocina), Inventario consume las reservas de sus insumos: baja el stock fisico
 * y el reservado, generando un movimiento SALIDA por cada insumo. Luego borra el
 * registro de reserva. Si el pedido no tenia reservas, no hace nada (idempotente).
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(PedidoListo)
export class OnPedidoListoHandler implements IEventHandler<PedidoListo> {
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
    @Inject('ReservaInsumoRepository')
    private readonly reservas: ReservaInsumoRepository,
  ) {}

  async handle(event: PedidoListo): Promise<void> {
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
      producto.consumirReserva(new Cantidad(linea.cantidad), event.pedidoId);
      productos.push(producto);
    }

    await this.repo.guardarVarios(productos);
    await this.reservas.eliminarPorPedido(event.pedidoId);
  }
}
