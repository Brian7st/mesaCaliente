import { Pedido } from '../../model/pedido.aggregate';
import { EstadoPedido } from '../../model/estado-pedido.vo';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

/**
 * Puerto de salida del Bounded Context Pedidos. Lo implementa un adaptador
 * concreto en infrastructure/out/persistence.
 */
export interface PedidoRepository {
  buscarPorId(id: string): Promise<Pedido | null>;
  guardar(pedido: Pedido): Promise<void>;
  listar(
    paginacion: ParametrosPaginacion,
    estado?: EstadoPedido,
  ): Promise<Pagina<Pedido>>;
}
