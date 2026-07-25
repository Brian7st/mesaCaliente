import { NumeroMesaInvalidoException } from '../exceptions/numero-mesa.exceptions';

/**
 * Value Object NumeroMesa. Inmutable. Identifica visualmente la mesa en el
 * salon; debe ser un entero positivo.
 */
export class NumeroMesa {
  readonly valor: number;

  constructor(valor: number) {
    if (!Number.isInteger(valor) || valor < 1) {
      throw new NumeroMesaInvalidoException(valor);
    }
    this.valor = valor;
  }
}
