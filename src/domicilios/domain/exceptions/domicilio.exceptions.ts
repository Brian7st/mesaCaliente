import { DomainException } from '../../../shared/domain/domain-exception.base';
import { EstadoDomicilio } from '../model/estado-domicilio.vo';

export class TransicionDomicilioInvalidaException extends DomainException {
  constructor(desde: EstadoDomicilio, hacia: EstadoDomicilio) {
    super(`Transicion invalida del domicilio: ${desde} -> ${hacia}.`);
  }
}
