import { randomUUID } from 'crypto';
import { TipoMovimiento } from './tipo-movimiento.vo';

/**
 * Entity append-only del kardex de inventario. Cada mutacion de stock de un
 * Producto genera un MovimientoInventario que deja trazabilidad de que paso,
 * cuanto y por que. No se modifica ni se borra: es un registro historico.
 */
export class MovimientoInventario {
  private constructor(
    private readonly _id: string,
    private readonly _productoId: string,
    private readonly _tipo: TipoMovimiento,
    private readonly _cantidad: number,
    private readonly _motivo: string | null,
    private readonly _fecha: Date,
  ) {}

  static registrar(
    productoId: string,
    tipo: TipoMovimiento,
    cantidad: number,
    motivo?: string | null,
  ): MovimientoInventario {
    return new MovimientoInventario(
      randomUUID(),
      productoId,
      tipo,
      cantidad,
      motivo ?? null,
      new Date(),
    );
  }

  static reconstituir(params: {
    id: string;
    productoId: string;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo: string | null;
    fecha: Date;
  }): MovimientoInventario {
    return new MovimientoInventario(
      params.id,
      params.productoId,
      params.tipo,
      params.cantidad,
      params.motivo,
      params.fecha,
    );
  }

  get id(): string {
    return this._id;
  }

  get productoId(): string {
    return this._productoId;
  }

  get tipo(): TipoMovimiento {
    return this._tipo;
  }

  get cantidad(): number {
    return this._cantidad;
  }

  get motivo(): string | null {
    return this._motivo;
  }

  get fecha(): Date {
    return this._fecha;
  }
}
