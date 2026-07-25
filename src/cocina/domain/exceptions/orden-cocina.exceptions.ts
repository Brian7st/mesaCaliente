import { DomainException } from '../../../shared/domain/domain-exception.base';
import { EstadoOrdenCocina } from '../model/estado-orden-cocina.vo';

export class TransicionOrdenInvalidaException extends DomainException {
  constructor(desde: EstadoOrdenCocina, hacia: EstadoOrdenCocina) {
    super(`Transicion invalida de la orden: ${desde} -> ${hacia}.`);
  }
}

export class OrdenCocinaIncompletaException extends DomainException {
  constructor(ordenId: string) {
    super(
      `No se puede finalizar la orden ${ordenId}: hay items sin preparar.`,
    );
  }
}

export class ItemOrdenNoEncontradoException extends DomainException {
  constructor(productoId: string) {
    super(
      `El producto ${productoId} no pertenece a esta orden de cocina.`,
      'NO_ENCONTRADO',
    );
  }
}
