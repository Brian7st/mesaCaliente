import { Producto } from '../../model/producto.aggregate';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

/**
 * Puerto de salida del Bounded Context Inventario. `guardarVarios` permite
 * persistir la reserva de todos los productos de un pedido de forma atomica
 * (patron Saga: todo o nada).
 */
export interface ProductoRepository {
  buscarPorId(id: string): Promise<Producto | null>;
  guardar(producto: Producto): Promise<void>;
  guardarVarios(productos: Producto[]): Promise<void>;
  listar(paginacion: ParametrosPaginacion): Promise<Pagina<Producto>>;
}
