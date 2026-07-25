import { DomainException } from '../../../shared/domain/domain-exception.base';

export class MontoInvalidoException extends DomainException {
  constructor(monto: number) {
    super(`El monto de Dinero no puede ser negativo: ${monto}`);
  }
}

export type Moneda = 'COP';

/**
 * Value Object Dinero. Inmutable. Todos los montos del sistema estan en COP.
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

  sumar(otro: Dinero): Dinero {
    return new Dinero(this.monto + otro.monto, this.moneda);
  }
}
