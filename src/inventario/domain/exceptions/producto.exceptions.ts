import { DomainException } from '../../../shared/domain/domain-exception.base';

export class StockInsuficienteException extends DomainException {
  constructor(productoId: string) {
    super(`Stock insuficiente para reservar el producto ${productoId}.`);
  }
}

export class ProductoNoEncontradoException extends DomainException {
  constructor(productoId: string) {
    super(`El producto ${productoId} no existe en el inventario.`, 'NO_ENCONTRADO');
  }
}
