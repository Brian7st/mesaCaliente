import { Dinero } from '../model/dinero.vo';
import { DireccionPedido } from '../model/pedido.aggregate';

export type ItemConfirmado = {
  platoId: string;
  cantidad: number;
  observacion?: string;
};

export class PedidoConfirmado {
  constructor(
    readonly pedidoId: string,
    readonly mesaId: string | null,
    readonly tipo: 'LOCAL' | 'DOMICILIO',
    readonly items: ItemConfirmado[],
    readonly total: Dinero,
    readonly fecha: Date,
    readonly direccion: DireccionPedido | null,
    readonly observacion: string | null,
  ) {}
}
