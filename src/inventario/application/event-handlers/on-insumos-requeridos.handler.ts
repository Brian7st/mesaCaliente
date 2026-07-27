import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DomainException } from '../../../shared/domain/domain-exception.base';
import { OutboxService } from '../../../shared/infrastructure/outbox/outbox.service';
import { InsumosRequeridos } from '../../../carta/domain/events/insumos-requeridos.event';
import { ProductoRepository } from '../../domain/ports/out/producto.repository';
import {
  ReservaInsumo,
  ReservaInsumoRepository,
} from '../../domain/ports/out/reserva-insumo.repository';
import { Producto } from '../../domain/model/producto.aggregate';
import { Cantidad } from '../../domain/model/cantidad.vo';
import { ProductoNoEncontradoException } from '../../domain/exceptions/producto.exceptions';
import { StockReservado } from '../../domain/events/stock-reservado.event';
import { ReservaStockFallida } from '../../domain/events/reserva-stock-fallida.event';

/**
 * Patron Saga (coreografia). Reacciona a InsumosRequeridos (que Carta derivo de
 * las recetas del pedido) e intenta reservar el stock de todos los insumos:
 *  - Si TODOS se reservan: persiste atomico, guarda el registro de reserva por
 *    pedido (para consumirlo/liberarlo luego) y emite StockReservado.
 *  - Si ALGUNO falla: no persiste nada y emite ReservaStockFallida.
 * Unica importacion cruzada: la clase del evento.
 */
@EventsHandler(InsumosRequeridos)
export class OnInsumosRequeridosHandler
  implements IEventHandler<InsumosRequeridos>
{
  constructor(
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
    @Inject('ReservaInsumoRepository')
    private readonly reservas: ReservaInsumoRepository,
    private readonly outbox: OutboxService,
  ) {}

  async handle(event: InsumosRequeridos): Promise<void> {
    const productos = new Map<string, Producto>();
    const reservados = new Map<string, number>();

    try {
      for (const req of event.insumos) {
        let producto = productos.get(req.insumoId);
        if (!producto) {
          const encontrado = await this.repo.buscarPorId(req.insumoId);
          if (!encontrado) {
            throw new ProductoNoEncontradoException(req.insumoId);
          }
          producto = encontrado;
          productos.set(req.insumoId, producto);
        }
        producto.reservarStock(new Cantidad(req.cantidad), event.pedidoId);
        reservados.set(
          req.insumoId,
          (reservados.get(req.insumoId) ?? 0) + req.cantidad,
        );
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
    const lineas: ReservaInsumo[] = Array.from(reservados.entries()).map(
      ([insumoId, cantidad]) => ({ insumoId, cantidad }),
    );
    await this.reservas.guardar(event.pedidoId, lineas);
    await this.outbox.registrar([
      new StockReservado(event.pedidoId, new Date()),
    ]);
  }
}
