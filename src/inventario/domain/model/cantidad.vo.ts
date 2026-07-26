import {
  CantidadInsuficienteException,
  CantidadInvalidaException,
} from '../exceptions/cantidad.exceptions';

/**
 * Value Object Cantidad. Inmutable. Envuelve un entero no negativo.
 */
export class Cantidad {
  readonly valor: number;

  constructor(valor: number) {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new CantidadInvalidaException(valor);
    }
    this.valor = valor;
  }

  sumar(otra: Cantidad): Cantidad {
    return new Cantidad(this.valor + otra.valor);
  }

  restar(otra: Cantidad): Cantidad {
    const resultado = this.valor - otra.valor;
    if (resultado < 0) {
      throw new CantidadInsuficienteException();
    }
    return new Cantidad(resultado);
  }

  mayorOIgual(otra: Cantidad): boolean {
    return this.valor >= otra.valor;
  }
}
