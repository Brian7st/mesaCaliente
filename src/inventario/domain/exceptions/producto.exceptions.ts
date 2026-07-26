import { DomainException } from '../../../shared/domain/domain-exception.base';

export class StockInsuficienteException extends DomainException {
  constructor(productoId: string) {
    super(`Stock insuficiente para reservar el producto ${productoId}.`);
  }
}
