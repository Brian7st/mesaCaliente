import { OrdenCocina } from '../../model/orden-cocina.aggregate';
import { EstadoOrdenCocina } from '../../model/estado-orden-cocina.vo';

/**
 * Puerto de salida del Bounded Context Cocina.
 */
export interface OrdenCocinaRepository {
  buscarPorId(id: string): Promise<OrdenCocina | null>;
  buscarPorPedidoId(pedidoId: string): Promise<OrdenCocina | null>;
  guardar(orden: OrdenCocina): Promise<void>;
  listar(estado?: EstadoOrdenCocina): Promise<OrdenCocina[]>;
}
