/**
 * Value Object EstadoOrdenCocina.
 * Transiciones: PENDIENTE -> EN_PREPARACION -> LISTA.
 */
export enum EstadoOrdenCocina {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTA = 'LISTA',
}
