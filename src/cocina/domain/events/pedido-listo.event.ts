/**
 * Domain Event publicado por Cocina (unico emisor canonico) cuando una
 * OrdenCocina se finaliza. Lo consumen Pedidos (actualiza su estado) y
 * Caja (genera la factura).
 */
export class PedidoListo {
  constructor(
    readonly pedidoId: string,
    readonly fecha: Date,
  ) {}
}
