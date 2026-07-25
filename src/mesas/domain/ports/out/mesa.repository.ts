import { Mesa } from '../../model/mesa.aggregate';

/**
 * Puerto de salida del Bounded Context Mesas.
 */
export interface MesaRepository {
  buscarPorId(id: string): Promise<Mesa | null>;
  guardar(mesa: Mesa): Promise<void>;
  listar(): Promise<Mesa[]>;
}
