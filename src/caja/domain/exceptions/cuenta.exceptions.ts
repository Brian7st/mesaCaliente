import { DomainException } from '../../../shared/domain/domain-exception.base';

export class CuentaYaPagadaException extends DomainException {
  constructor(cuentaId: string) {
    super(`La cuenta ${cuentaId} ya fue pagada.`);
  }
}

export class CuentaCerradaException extends DomainException {
  constructor(cuentaId: string) {
    super(`La cuenta ${cuentaId} esta cerrada: no admite cambios.`);
  }
}
