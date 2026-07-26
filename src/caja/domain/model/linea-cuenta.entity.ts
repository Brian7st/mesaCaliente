import { Dinero } from './dinero.vo';

/**
 * Entity interna de la Cuenta: el cargo de un pedido servido en la mesa.
 */
export class LineaCuenta {
  constructor(
    readonly pedidoId: string,
    readonly total: Dinero,
  ) {}
}
