/**
 * Tipos de movimiento del kardex de inventario:
 *  - ENTRADA: ingreso de stock (compra/reposicion).
 *  - SALIDA: egreso de stock (consumo por pedido LISTO o merma manual).
 *  - RESERVA: apartado de stock al confirmarse un pedido (aun no consumido).
 *  - LIBERACION: devolucion de una reserva al cancelarse el pedido.
 */
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'RESERVA' | 'LIBERACION';
