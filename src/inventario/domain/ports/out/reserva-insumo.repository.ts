/**
 * Una linea de reserva: cuanto de un insumo quedo apartado para un pedido.
 */
export interface ReservaInsumo {
  insumoId: string;
  cantidad: number;
}

/**
 * Puerto de salida que lleva el registro de que insumos (y cuanto) se
 * reservaron para cada pedido. Permite, mas tarde, consumir la reserva cuando
 * el pedido queda LISTO o liberarla si se cancela, sin recalcular recetas.
 */
export interface ReservaInsumoRepository {
  guardar(pedidoId: string, reservas: ReservaInsumo[]): Promise<void>;
  buscarPorPedido(pedidoId: string): Promise<ReservaInsumo[]>;
  eliminarPorPedido(pedidoId: string): Promise<void>;
}
