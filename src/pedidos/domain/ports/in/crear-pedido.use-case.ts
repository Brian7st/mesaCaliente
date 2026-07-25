import { TipoPedido } from '../../model/pedido.aggregate';

/**
 * Puerto de entrada para la operacion de crear un pedido. La implementacion
 * concreta se resuelve via CQRS (CrearPedidoCommand + su Handler).
 */
export interface CrearPedidoUseCase {
  ejecutar(input: {
    pedidoId: string;
    mesaId?: string | null;
    tipo: TipoPedido;
  }): Promise<void>;
}
