/**
 * Puerto de entrada para la operacion de confirmar un pedido. La implementacion
 * concreta se resuelve via CQRS (ConfirmarPedidoCommand + su Handler).
 */
export interface ConfirmarPedidoUseCase {
  ejecutar(input: { pedidoId: string }): Promise<void>;
}
