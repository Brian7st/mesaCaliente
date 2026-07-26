import { Domicilio } from '../../model/domicilio.aggregate';

/**
 * Puerto de salida del Bounded Context Domicilios.
 */
export interface DomicilioRepository {
  buscarPorId(id: string): Promise<Domicilio | null>;
  guardar(domicilio: Domicilio): Promise<void>;
  listar(): Promise<Domicilio[]>;
}
