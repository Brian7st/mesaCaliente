export class ActualizarPrecioCommand {
  constructor(
    readonly platoId: string,
    readonly precio: number,
  ) {}
}
