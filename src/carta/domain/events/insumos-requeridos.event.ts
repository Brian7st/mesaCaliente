/**
 * Publicado por Carta al confirmarse un pedido: traduce los platos del pedido
 * a los insumos que requieren (segun sus recetas). Lo consume Inventario para
 * reservar stock.
 */
export class InsumosRequeridos {
  constructor(
    readonly pedidoId: string,
    readonly insumos: { insumoId: string; cantidad: number }[],
    readonly fecha: Date,
  ) {}
}
