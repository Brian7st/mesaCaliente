import { Dinero } from './dinero.vo';

/**
 * Entity interna del Aggregate Pedido. Referencia un plato de la Carta
 * (`platoId`); el `precioUnitario` es un snapshot congelado del catalogo al
 * momento de agregarlo. `observacion` es una nota para cocina ("sin cebolla").
 */
export class ItemPedido {
  constructor(
    readonly id: string,
    readonly platoId: string,
    readonly cantidad: number,
    readonly precioUnitario: Dinero,
    readonly observacion?: string,
  ) {}

  subtotal(): Dinero {
    return new Dinero(
      this.precioUnitario.monto * this.cantidad,
      this.precioUnitario.moneda,
    );
  }
}
