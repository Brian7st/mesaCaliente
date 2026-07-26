import { MontoInvalidoException } from '../exceptions/dinero.exceptions';

export type Moneda = 'COP';

/**
 * Value Object Dinero propio del contexto Carta (cada Bounded Context tiene su
 * propio modelo). Inmutable, montos en COP.
 */
export class Dinero {
  readonly monto: number;
  readonly moneda: Moneda;

  constructor(monto: number, moneda: Moneda = 'COP') {
    if (monto < 0) {
      throw new MontoInvalidoException(monto);
    }
    this.monto = monto;
    this.moneda = moneda;
  }
}
