/**
 * Value Object EstadoPedido. Estados posibles del ciclo de vida de un Pedido.
 * Transiciones validas:
 *   BORRADOR -> CONFIRMADO -> EN_PREPARACION -> LISTO -> PAGADO
 *   CONFIRMADO -> CANCELADO
 */
export enum EstadoPedido {
  BORRADOR = 'BORRADOR',
  CONFIRMADO = 'CONFIRMADO',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO = 'LISTO',
  PAGADO = 'PAGADO',
  CANCELADO = 'CANCELADO',
}
