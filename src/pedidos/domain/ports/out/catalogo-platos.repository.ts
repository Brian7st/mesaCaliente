/**
 * Vista local (read-model) del catalogo de Carta que Pedidos mantiene por
 * eventos, para poder resolver precio/disponibilidad de un plato al agregarlo
 * a un pedido sin llamar directamente a Carta (regla dura 3.4).
 */
export type PlatoCatalogo = {
  platoId: string;
  nombre: string;
  precio: number;
  disponible: boolean;
};

export interface CatalogoPlatosRepository {
  buscarPorId(platoId: string): Promise<PlatoCatalogo | null>;
  guardarPlato(plato: PlatoCatalogo): Promise<void>;
  actualizarPrecio(platoId: string, precio: number): Promise<void>;
  actualizarDisponibilidad(
    platoId: string,
    disponible: boolean,
  ): Promise<void>;
}
