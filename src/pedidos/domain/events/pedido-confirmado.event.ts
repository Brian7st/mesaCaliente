import { Dinero } from '../model/dinero.vo';
import { DireccionPedido } from '../model/pedido.aggregate';

export class PedidoConfirmado {
  constructor(
    readonly pedidoId: string,
    readonly mesaId: string | null,
    readonly tipo: 'LOCAL' | 'DOMICILIO',
    readonly items: { productoId: string; cantidad: number }[],
    readonly total: Dinero,
    readonly fecha: Date,
    readonly direccion: DireccionPedido | null,
  ) {}
}
