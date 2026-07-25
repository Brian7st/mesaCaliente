/**
 * Entity interna de la OrdenCocina. Representa un item a preparar; su estado
 * `preparado` es lo unico mutable.
 */
export class ItemOrden {
  private _preparado: boolean;

  constructor(
    readonly productoId: string,
    readonly cantidad: number,
    preparado = false,
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
