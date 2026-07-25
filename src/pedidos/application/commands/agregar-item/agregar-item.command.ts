export class AgregarItemCommand {
  constructor(
    readonly pedidoId: string,
    readonly productoId: string,
    readonly cantidad: number,
    readonly precioUnitario: number,
  ) {}
}
