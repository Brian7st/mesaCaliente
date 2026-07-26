/**
 * Publicado por Domicilios cuando una entrega se confirma (estado ENTREGADO).
 */
export class DomicilioEntregado {
  constructor(
    readonly domicilioId: string,
    readonly pedidoId: string,
    readonly fecha: Date,
  ) {}
}
