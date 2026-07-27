export class DefinirRecetaCommand {
  constructor(
    readonly platoId: string,
    readonly receta: { insumoId: string; cantidad: number }[],
  ) {}
}
