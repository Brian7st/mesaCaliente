import { Cantidad } from './cantidad.vo';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { StockInsuficienteException } from '../exceptions/producto.exceptions';

/**
 * Aggregate Root de Inventario. Controla el stock disponible y el reservado.
 * disponible = stock - stockReservado.
 *
 * Cada mutacion de stock acumula un MovimientoInventario (kardex) que el
 * repositorio persiste junto con el Aggregate en la misma transaccion, del
 * mismo modo que el patron Outbox persiste los Domain Events.
 */
export class Producto {
  private readonly _movimientos: MovimientoInventario[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _nombre: string,
    private _stock: Cantidad,
    private _stockReservado: Cantidad,
  ) {}

  static crear(id: string, nombre: string, stockInicial: Cantidad): Producto {
    return new Producto(id, nombre, stockInicial, new Cantidad(0));
  }

  static reconstituir(params: {
    id: string;
    nombre: string;
    stock: Cantidad;
    stockReservado: Cantidad;
  }): Producto {
    return new Producto(
      params.id,
      params.nombre,
      params.stock,
      params.stockReservado,
    );
  }

  /** Aparta stock para un pedido. No baja el stock fisico, sube el reservado. */
  reservarStock(cantidad: Cantidad, pedidoId?: string): void {
    const disponible = this._stock.restar(this._stockReservado);
    if (!disponible.mayorOIgual(cantidad)) {
      throw new StockInsuficienteException(this._id);
    }
    this._stockReservado = this._stockReservado.sumar(cantidad);
    this.registrarMovimiento('RESERVA', cantidad, pedidoId);
  }

  /**
   * Consume una reserva previa (pedido LISTO): baja el stock fisico y el
   * reservado en la misma cantidad. Genera una SALIDA en el kardex.
   */
  consumirReserva(cantidad: Cantidad, pedidoId?: string): void {
    this._stock = this._stock.restar(cantidad);
    this._stockReservado = this._stockReservado.restar(cantidad);
    this.registrarMovimiento('SALIDA', cantidad, pedidoId);
  }

  /**
   * Libera una reserva previa (pedido CANCELADO): devuelve el reservado sin
   * tocar el stock fisico. Genera una LIBERACION en el kardex.
   */
  liberarReserva(cantidad: Cantidad, pedidoId?: string): void {
    this._stockReservado = this._stockReservado.restar(cantidad);
    this.registrarMovimiento('LIBERACION', cantidad, pedidoId);
  }

  /** Ingreso de stock (compra/reposicion). Genera una ENTRADA en el kardex. */
  reponer(cantidad: Cantidad, motivo?: string): void {
    this._stock = this._stock.sumar(cantidad);
    this.registrarMovimiento('ENTRADA', cantidad, motivo);
  }

  /**
   * Egreso manual de stock fisico (merma, ajuste). No puede dejar el stock por
   * debajo de lo reservado. Genera una SALIDA en el kardex.
   */
  registrarSalida(cantidad: Cantidad, motivo?: string): void {
    const disponible = this._stock.restar(this._stockReservado);
    if (!disponible.mayorOIgual(cantidad)) {
      throw new StockInsuficienteException(this._id);
    }
    this._stock = this._stock.restar(cantidad);
    this.registrarMovimiento('SALIDA', cantidad, motivo);
  }

  private registrarMovimiento(
    tipo: 'ENTRADA' | 'SALIDA' | 'RESERVA' | 'LIBERACION',
    cantidad: Cantidad,
    motivo?: string | null,
  ): void {
    this._movimientos.push(
      MovimientoInventario.registrar(this._id, tipo, cantidad.valor, motivo),
    );
  }

  /** Movimientos acumulados en esta operacion, para que el repo los persista. */
  obtenerMovimientos(): MovimientoInventario[] {
    return [...this._movimientos];
  }

  get id(): string {
    return this._id;
  }

  get nombre(): string {
    return this._nombre;
  }

  get stock(): Cantidad {
    return this._stock;
  }

  get stockReservado(): Cantidad {
    return this._stockReservado;
  }
}
