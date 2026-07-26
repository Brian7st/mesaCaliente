export class CrearProductoCommand {
  constructor(
    readonly productoId: string,
    readonly nombre: string,
    readonly stockInicial: number,
  ) {}
}
