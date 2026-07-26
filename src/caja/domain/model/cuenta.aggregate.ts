import { Dinero } from './dinero.vo';
import { EstadoCuenta } from './estado-cuenta.vo';
import { LineaCuenta } from './linea-cuenta.entity';
import {
  CuentaCerradaException,
  CuentaYaPagadaException,
} from '../exceptions/cuenta.exceptions';
import { PagoRegistrado } from '../events/pago-registrado.event';

/**
 * Aggregate Root de Caja. Agrupa los pedidos de una sesion de mesa (o de un
 * unico domicilio) en una cuenta que se paga una sola vez.
 */
export class Cuenta {
  private readonly _lineas: LineaCuenta[];
  private readonly _eventos: object[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _mesaId: string | null,
    private _estado: EstadoCuenta,
    lineas: LineaCuenta[],
  ) {
    this._lineas = lineas;
  }

  static abrir(id: string, mesaId: string | null): Cuenta {
    return new Cuenta(id, mesaId, EstadoCuenta.ABIERTA, []);
  }

  static reconstituir(params: {
    id: string;
    mesaId: string | null;
    estado: EstadoCuenta;
    lineas: LineaCuenta[];
  }): Cuenta {
    return new Cuenta(params.id, params.mesaId, params.estado, params.lineas);
  }

  agregarPedido(pedidoId: string, total: Dinero): void {
    if (this._estado !== EstadoCuenta.ABIERTA) {
      throw new CuentaCerradaException(this._id);
    }
    // Idempotencia: si el pedido ya esta en la cuenta, no se duplica.
    if (this._lineas.some((linea) => linea.pedidoId === pedidoId)) {
      return;
    }
    this._lineas.push(new LineaCuenta(pedidoId, total));
  }

  quitarPedido(pedidoId: string): void {
    if (this._estado !== EstadoCuenta.ABIERTA) {
      throw new CuentaCerradaException(this._id);
    }
    const indice = this._lineas.findIndex(
      (linea) => linea.pedidoId === pedidoId,
    );
    if (indice >= 0) {
      this._lineas.splice(indice, 1);
    }
  }

  pagar(): void {
    if (this._estado === EstadoCuenta.PAGADA) {
      throw new CuentaYaPagadaException(this._id);
    }
    this._estado = EstadoCuenta.PAGADA;
    this._eventos.push(
      new PagoRegistrado(
        this._id,
        this._mesaId,
        this._lineas.map((linea) => linea.pedidoId),
        this.total(),
        new Date(),
      ),
    );
  }

  total(): Dinero {
    return this._lineas.reduce(
      (acc, linea) => acc.sumar(linea.total),
      new Dinero(0),
    );
  }

  obtenerEventos(): object[] {
    return [...this._eventos];
  }

  get id(): string {
    return this._id;
  }

  get mesaId(): string | null {
    return this._mesaId;
  }

  get estado(): EstadoCuenta {
    return this._estado;
  }

  get lineas(): ReadonlyArray<LineaCuenta> {
    return this._lineas;
  }
}
