import { Plato } from '../../model/plato.aggregate';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

/**
 * Puerto de salida del Bounded Context Carta.
 */
export interface PlatoRepository {
  buscarPorId(id: string): Promise<Plato | null>;
  guardar(plato: Plato): Promise<void>;
  listar(paginacion: ParametrosPaginacion): Promise<Pagina<Plato>>;
}
