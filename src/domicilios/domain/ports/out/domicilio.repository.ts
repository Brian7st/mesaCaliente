import { Domicilio } from '../../model/domicilio.aggregate';
import { Pagina, ParametrosPaginacion } from '../../../../shared/application/pagina';

/**
 * Puerto de salida del Bounded Context Domicilios.
 */
export interface DomicilioRepository {
  buscarPorId(id: string): Promise<Domicilio | null>;
  guardar(domicilio: Domicilio): Promise<void>;
  listar(paginacion: ParametrosPaginacion): Promise<Pagina<Domicilio>>;
}
