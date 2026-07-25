import { DomainException } from '../../../shared/domain/domain-exception.base';

export class NumeroMesaInvalidoException extends DomainException {
  constructor(valor: number) {
    super(`El numero de mesa debe ser un entero positivo: ${valor}`);
  }
}
