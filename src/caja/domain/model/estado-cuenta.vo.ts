/**
 * Value Object EstadoCuenta. Una cuenta acumula lineas mientras esta ABIERTA;
 * al pagarse pasa a PAGADA (terminal).
 */
export enum EstadoCuenta {
  ABIERTA = 'ABIERTA',
  PAGADA = 'PAGADA',
}
