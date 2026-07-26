import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DomainException } from '../../../shared/domain/domain-exception.base';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { ProductoRepository } from '../../domain/ports/out/producto.repository';
import { Producto } from '../../domain/model/producto.aggregate';
import { Cantidad } from '../../domain/model/cantidad.vo';
import { ProductoNoEncontradoException } from '../../domain/exceptions/producto.exceptions';
import { StockReservado } from '../../domain/events/stock-reservado.event';
import { ReservaStockFallida } from '../../domain/events/reserva-stock-fallida.event';

/**
 * Patron Saga (coreografia). Reacciona a PedidoConfirmado e intenta reservar
 * el stock de todos los items:
 *  - Si TODOS se reservan: persiste de forma atomica y emite StockReservado.
 *  - Si ALGUNO falla: no persiste nada (revert natural, la mutacion en memoria
 *    se descarta) y emite ReservaStockFallida en vez de propagar la excepcion.
 * La compensacion del lado de Pedidos (cancelar) se implementa en Fase 5.
 */
@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler
  implements IEventHandler<PedidoConfirmado>
{
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
    private readonly outbox: OutboxService,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    // Un unico Producto en memoria por productoId, para acumular correctamente
    // cuando el pedido repite el mismo producto en varios items.
    const productos = new Map<string, Producto>();

    try {
      for (const item of event.items) {
        let producto = productos.get(item.productoId);
        if (!producto) {
          const encontrado = await this.repo.buscarPorId(item.productoId);
          if (!encontrado) {
            throw new ProductoNoEncontradoException(item.productoId);
          }
          producto = encontrado;
          productos.set(item.productoId, producto);
        }
        producto.reservarStock(new Cantidad(item.cantidad));
      }
    } catch (error) {
      if (error instanceof DomainException) {
        await this.outbox.registrar([
          new ReservaStockFallida(event.pedidoId, error.message, new Date()),
        ]);
        return;
      }
      throw error;
    }

    await this.repo.guardarVarios(Array.from(productos.values()));
    await this.outbox.registrar([
      new StockReservado(event.pedidoId, new Date()),
    ]);
  }
}
