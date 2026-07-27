import { DomainException } from '../../../shared/domain/domain-exception.base';

export class MontoInvalidoException extends DomainException {
  constructor(monto: number) {
    super(`El monto de Dinero no puede ser negativo: ${monto}`);
  }
}
