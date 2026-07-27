export class AgregarItemCommand {
  constructor(
    readonly pedidoId: string,
    readonly platoId: string,
    readonly cantidad: number,
    readonly observacion?: string,
  ) {}
}
