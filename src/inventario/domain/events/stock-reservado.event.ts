/**
 * Publicado por Inventario cuando se reserva con exito el stock de todos los
 * items de un pedido. Lo consume Pedidos (avanza a EN_PREPARACION en Fase 5).
 */
export class StockReservado {
  constructor(
    readonly pedidoId: string,
    readonly fecha: Date,
  ) {}
}
