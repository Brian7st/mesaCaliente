import { Dinero } from '../model/dinero.vo';

/**
 * Publicado por Carta al cambiar el precio de un plato. Actualiza la proyeccion
 * de catalogo de Pedidos.
 */
export class PrecioActualizado {
  constructor(
    readonly platoId: string,
    readonly precio: Dinero,
    readonly fecha: Date,
  ) {}
}
