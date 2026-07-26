import { Direccion } from './direccion.vo';
import { EstadoDomicilio } from './estado-domicilio.vo';
import { TransicionDomicilioInvalidaException } from '../exceptions/domicilio.exceptions';
import { DomicilioEntregado } from '../events/domicilio-entregado.event';

/**
 * Aggregate Root de Domicilios. Se crea reaccionando a PedidoConfirmado (solo
 * si el pedido es DOMICILIO) y rastrea la entrega hasta ENTREGADO.
 */
export class Domicilio {
  private readonly _eventos: object[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _pedidoId: string,
    private readonly _direccion: Direccion,
    private _estado: EstadoDomicilio,
  ) {}

  static crear(id: string, pedidoId: string, direccion: Direccion): Domicilio {
    return new Domicilio(id, pedidoId, direccion, EstadoDomicilio.ASIGNADO);
  }

  static reconstituir(params: {
    id: string;
    pedidoId: string;
    direccion: Direccion;
    estado: EstadoDomicilio;
  }): Domicilio {
    return new Domicilio(
      params.id,
      params.pedidoId,
      params.direccion,
      params.estado,
    );
  }

  iniciarEntrega(): void {
    if (this._estado !== EstadoDomicilio.ASIGNADO) {
      throw new TransicionDomicilioInvalidaException(
        this._estado,
        EstadoDomicilio.EN_CAMINO,
      );
    }
    this._estado = EstadoDomicilio.EN_CAMINO;
  }

  confirmarEntrega(): void {
    if (this._estado !== EstadoDomicilio.EN_CAMINO) {
      throw new TransicionDomicilioInvalidaException(
        this._estado,
        EstadoDomicilio.ENTREGADO,
      );
    }
    this._estado = EstadoDomicilio.ENTREGADO;
    this._eventos.push(
      new DomicilioEntregado(this._id, this._pedidoId, new Date()),
    );
  }

  obtenerEventos(): object[] {
    return [...this._eventos];
  }

  get id(): string {
    return this._id;
  }

  get pedidoId(): string {
    return this._pedidoId;
  }

  get direccion(): Direccion {
    return this._direccion;
  }

  get estado(): EstadoDomicilio {
    return this._estado;
  }
}
