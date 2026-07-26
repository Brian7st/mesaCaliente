/**
 * Publicado por Inventario cuando no alcanza el stock para algun item del
 * pedido. Lo consume Pedidos para compensar (cancela el pedido, Fase 5).
 */
export class ReservaStockFallida {
  constructor(
    readonly pedidoId: string,
    readonly motivo: string,
    readonly fecha: Date,
  ) {}
}
