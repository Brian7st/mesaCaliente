import { Dinero } from '../model/dinero.vo';

export class PedidoConfirmado {
  constructor(
    readonly pedidoId: string,
    readonly mesaId: string | null,
    readonly tipo: 'LOCAL' | 'DOMICILIO',
    readonly items: { productoId: string; cantidad: number }[],
    readonly total: Dinero,
    readonly fecha: Date,
  ) {}
}
