import { Dinero } from './dinero.vo';

/**
 * Entity interna del Aggregate Pedido. No se expone como Aggregate propio.
 */
export class ItemPedido {
  constructor(
    readonly id: string,
    readonly productoId: string,
    readonly cantidad: number,
    readonly precioUnitario: Dinero,
  ) {}

  subtotal(): Dinero {
    return new Dinero(
      this.precioUnitario.monto * this.cantidad,
      this.precioUnitario.moneda,
    );
  }
}
