import { Dinero } from '../model/dinero.vo';

/**
 * Publicado por Carta al crearse un plato. Lo consume Pedidos para su
 * proyeccion local del catalogo (precio/disponibilidad).
 */
export class PlatoCreado {
  constructor(
    readonly platoId: string,
    readonly nombre: string,
    readonly precio: Dinero,
    readonly disponible: boolean,
    readonly fecha: Date,
  ) {}
}
