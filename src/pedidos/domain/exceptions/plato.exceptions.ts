import { DomainException } from '../../../shared/domain/domain-exception.base';

export class PlatoNoEncontradoException extends DomainException {
  constructor(platoId: string) {
    super(`El plato ${platoId} no existe en la carta.`, 'NO_ENCONTRADO');
  }
}

export class PlatoNoDisponibleException extends DomainException {
  constructor(platoId: string) {
    super(`El plato ${platoId} no esta disponible.`);
  }
}
