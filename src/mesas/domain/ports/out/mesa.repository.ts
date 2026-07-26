import { Mesa } from '../../model/mesa.aggregate';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

/**
 * Puerto de salida del Bounded Context Mesas.
 */
export interface MesaRepository {
  buscarPorId(id: string): Promise<Mesa | null>;
  guardar(mesa: Mesa): Promise<void>;
  listar(paginacion: ParametrosPaginacion): Promise<Pagina<Mesa>>;
}
