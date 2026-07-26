/**
 * Value Object EstadoDomicilio.
 * Transiciones: ASIGNADO -> EN_CAMINO -> ENTREGADO.
 */
export enum EstadoDomicilio {
  ASIGNADO = 'ASIGNADO',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
}
