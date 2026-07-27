export class RegistrarSalidaCommand {
  constructor(
    readonly productoId: string,
    readonly cantidad: number,
    readonly motivo?: string,
  ) {}
}
