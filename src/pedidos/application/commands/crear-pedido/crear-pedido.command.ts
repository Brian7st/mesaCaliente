import { DireccionPedido, TipoPedido } from '../../../domain/model/pedido.aggregate';

export class CrearPedidoCommand {
  constructor(
    readonly pedidoId: string,
    readonly mesaId: string | null,
    readonly tipo: TipoPedido,
    readonly direccion: DireccionPedido | null = null,
    readonly observacion: string | null = null,
  ) {}
}
