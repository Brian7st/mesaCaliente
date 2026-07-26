import { Cantidad } from './cantidad.vo';
import { StockInsuficienteException } from '../exceptions/producto.exceptions';

/**
 * Aggregate Root de Inventario. Controla el stock disponible y el reservado.
 * disponible = stock - stockReservado.
 */
export class Producto {
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

  reservarStock(cantidad: Cantidad): void {
    const disponible = this._stock.restar(this._stockReservado);
    if (!disponible.mayorOIgual(cantidad)) {
      throw new StockInsuficienteException(this._id);
    }
    this._stockReservado = this._stockReservado.sumar(cantidad);
  }

  reponer(cantidad: Cantidad): void {
    this._stock = this._stock.sumar(cantidad);
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
