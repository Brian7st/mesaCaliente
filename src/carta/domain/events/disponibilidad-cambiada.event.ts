/**
 * Publicado por Carta al cambiar la disponibilidad de un plato. Actualiza la
 * proyeccion de catalogo de Pedidos.
 */
export class DisponibilidadCambiada {
  constructor(
    readonly platoId: string,
    readonly disponible: boolean,
    readonly fecha: Date,
  ) {}
}
