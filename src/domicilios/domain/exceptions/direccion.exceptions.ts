import { DomainException } from '../../../shared/domain/domain-exception.base';

export class DireccionInvalidaException extends DomainException {
  constructor(motivo: string) {
    super(`Direccion invalida: ${motivo}`);
  }
}
