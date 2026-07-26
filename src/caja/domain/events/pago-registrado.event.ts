import { Dinero } from '../model/dinero.vo';

/**
 * Publicado por Caja al pagarse una cuenta. Lo consumen Mesas (libera la mesa)
 * y Pedidos (marca como PAGADO cada pedido de la cuenta).
 */
export class PagoRegistrado {
  constructor(
    readonly cuentaId: string,
    readonly mesaId: string | null,
    readonly pedidoIds: string[],
    readonly total: Dinero,
    readonly fecha: Date,
  ) {}
}
