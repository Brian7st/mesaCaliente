/**
 * Excepcion base del dominio. Toda regla de negocio que se viole debe lanzar
 * una excepcion que extienda esta clase (ej. PedidoVacioException).
 * El filtro global (domain-exception.filter.ts) la traduce a un codigo HTTP.
 *
 * `tipo` permite al filtro decidir el status: 'REGLA_NEGOCIO' -> 400,
 * 'NO_ENCONTRADO' -> 404.
 */
export type TipoDomainException = 'REGLA_NEGOCIO' | 'NO_ENCONTRADO';

export abstract class DomainException extends Error {
  readonly tipo: TipoDomainException;

  constructor(mensaje: string, tipo: TipoDomainException = 'REGLA_NEGOCIO') {
    super(mensaje);
    this.name = this.constructor.name;
    this.tipo = tipo;
  }
}
