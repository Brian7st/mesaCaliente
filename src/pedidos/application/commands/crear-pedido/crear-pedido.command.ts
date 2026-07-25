import { TipoPedido } from '../../../domain/model/pedido.aggregate';

export class CrearPedidoCommand {
  constructor(
    readonly pedidoId: string,
    readonly mesaId: string | null,
    readonly tipo: TipoPedido,
  ) {}
}
