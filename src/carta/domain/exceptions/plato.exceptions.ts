import { DomainException } from '../../../shared/domain/domain-exception.base';

export class PlatoSinNombreException extends DomainException {
  constructor() {
    super('El plato debe tener un nombre.');
  }
}

export class CantidadRecetaInvalidaException extends DomainException {
  constructor(insumoId: string) {
    super(
      `La cantidad de la receta para el insumo ${insumoId} debe ser un entero positivo.`,
    );
  }
}
