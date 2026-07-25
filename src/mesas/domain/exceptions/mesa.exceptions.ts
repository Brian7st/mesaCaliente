import { DomainException } from '../../../shared/domain/domain-exception.base';

export class MesaYaOcupadaException extends DomainException {
  constructor(mesaId: string) {
    super(`La mesa ${mesaId} ya esta OCUPADA.`);
  }
}

export class MesaYaLibreException extends DomainException {
  constructor(mesaId: string) {
    super(`La mesa ${mesaId} ya esta LIBRE.`);
  }
}

export class NumeroMesaDuplicadoException extends DomainException {
  constructor(numero: number) {
    super(`Ya existe una mesa con el numero ${numero}.`);
  }
}
