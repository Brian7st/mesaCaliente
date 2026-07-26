/**
 * Value Object EstadoOrdenCocina.
 * Transiciones: PENDIENTE -> EN_PREPARACION -> LISTA.
 * Desde PENDIENTE o EN_PREPARACION puede pasar a DESCARTADA (si el pedido
 * se cancela por compensacion del Saga).
 */
export enum EstadoOrdenCocina {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTA = 'LISTA',
  DESCARTADA = 'DESCARTADA',
}
