/**
 * Entity interna de la OrdenCocina. Representa un plato a preparar; `preparado`
 * es lo unico mutable. `observacion` es la nota de cocina del item.
 */
export class ItemOrden {
  private _preparado: boolean;

  constructor(
    readonly platoId: string,
    readonly cantidad: number,
    preparado = false,
    readonly observacion?: string,
  ) {
    this._preparado = preparado;
  }

  preparar(): void {
    this._preparado = true;
  }

  get preparado(): boolean {
    return this._preparado;
  }
}
