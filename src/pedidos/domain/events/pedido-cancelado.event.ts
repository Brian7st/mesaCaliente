export class PedidoCancelado {
  constructor(
    readonly pedidoId: string,
    readonly motivo: string,
    readonly fecha: Date,
  ) {}
}
