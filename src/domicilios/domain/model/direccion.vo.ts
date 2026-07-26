import { DireccionInvalidaException } from '../exceptions/direccion.exceptions';

/**
 * Value Object Direccion, propio del contexto Domicilios (su dueño real).
 * Inmutable; valida que calle y ciudad no esten vacias.
 */
export class Direccion {
  readonly calle: string;
  readonly ciudad: string;
  readonly referencia?: string;

  constructor(calle: string, ciudad: string, referencia?: string) {
    if (!calle || calle.trim().length === 0) {
      throw new DireccionInvalidaException('la calle es obligatoria');
    }
    if (!ciudad || ciudad.trim().length === 0) {
      throw new DireccionInvalidaException('la ciudad es obligatoria');
    }
    this.calle = calle;
    this.ciudad = ciudad;
    this.referencia = referencia;
  }
}
