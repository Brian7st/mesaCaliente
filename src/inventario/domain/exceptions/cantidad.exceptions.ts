import { DomainException } from '../../../shared/domain/domain-exception.base';

export class CantidadInvalidaException extends DomainException {
  constructor(valor: number) {
    super(`La cantidad debe ser un entero mayor o igual a 0: ${valor}`);
  }
}

export class CantidadInsuficienteException extends DomainException {
  constructor() {
    super('La operacion dejaria la cantidad en negativo.');
  }
}
