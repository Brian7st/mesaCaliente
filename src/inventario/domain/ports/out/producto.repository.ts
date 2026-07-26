import { Producto } from '../../model/producto.aggregate';

/**
 * Puerto de salida del Bounded Context Inventario. `guardarVarios` permite
 * persistir la reserva de todos los productos de un pedido de forma atomica
 * (patron Saga: todo o nada).
 */
export interface ProductoRepository {
  buscarPorId(id: string): Promise<Producto | null>;
  guardar(producto: Producto): Promise<void>;
  guardarVarios(productos: Producto[]): Promise<void>;
  listar(): Promise<Producto[]>;
}
