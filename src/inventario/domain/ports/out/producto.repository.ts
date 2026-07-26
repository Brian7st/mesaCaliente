import { Producto } from '../../model/producto.aggregate';
import { MovimientoInventario } from '../../model/movimiento-inventario.entity';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

/**
 * Puerto de salida del Bounded Context Inventario. `guardarVarios` permite
 * persistir la reserva de todos los productos de un pedido de forma atomica
 * (patron Saga: todo o nada). `guardar`/`guardarVarios` persisten tambien los
 * movimientos de kardex acumulados en el Aggregate.
 */
export interface ProductoRepository {
  buscarPorId(id: string): Promise<Producto | null>;
  guardar(producto: Producto): Promise<void>;
  guardarVarios(productos: Producto[]): Promise<void>;
  listar(paginacion: ParametrosPaginacion): Promise<Pagina<Producto>>;
  listarMovimientos(
    productoId: string,
    paginacion: ParametrosPaginacion,
  ): Promise<Pagina<MovimientoInventario>>;
}
