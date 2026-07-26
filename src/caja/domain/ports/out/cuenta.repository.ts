import { Cuenta } from '../../model/cuenta.aggregate';

/**
 * Puerto de salida del Bounded Context Caja.
 */
export interface CuentaRepository {
  buscarPorId(id: string): Promise<Cuenta | null>;
  /** Cuenta ABIERTA de una mesa, si existe (para acumular sus pedidos). */
  buscarAbiertaPorMesa(mesaId: string): Promise<Cuenta | null>;
  guardar(cuenta: Cuenta): Promise<void>;
  listar(): Promise<Cuenta[]>;
}
