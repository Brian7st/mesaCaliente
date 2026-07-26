import { CantidadRecetaInvalidaException } from '../exceptions/plato.exceptions';

/**
 * Entity interna del Plato: cuanto de un insumo (de Inventario) consume el
 * plato. `insumoId` referencia un Producto de Inventario por ID (sin importar
 * su clase: la comunicacion entre contextos es solo por eventos/IDs).
 */
export class LineaReceta {
  constructor(
    readonly insumoId: string,
    readonly cantidad: number,
  ) {
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new CantidadRecetaInvalidaException(insumoId);
    }
  }
}
