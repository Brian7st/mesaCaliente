import { Dinero } from './dinero.vo';
import { EstadoPedido } from './estado-pedido.vo';
import { ItemPedido } from './item-pedido.entity';
import {
  PedidoVacioException,
  PedidoYaConfirmadoException,
  TransicionInvalidaException,
} from '../exceptions/pedido.exceptions';
import { PedidoConfirmado } from '../events/pedido-confirmado.event';
import { PedidoCancelado } from '../events/pedido-cancelado.event';

export type TipoPedido = 'LOCAL' | 'DOMICILIO';

/**
 * Datos de entrega que el pedido transporta hasta Domicilios. Pedidos no valida
 * ni modela la direccion (eso es del contexto Domicilios); solo la lleva.
 */
export type DireccionPedido = {
  calle: string;
  ciudad: string;
  referencia?: string;
};

/**
 * Aggregate Root del Core Domain. Toda regla de negocio del pedido vive aca.
 * Acumula Domain Events que el Command Handler publica DESPUES de persistir.
 */
export class Pedido {
  private readonly _items: ItemPedido[];
  private readonly _eventos: object[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _mesaId: string | null,
    private readonly _tipo: TipoPedido,
    private _estado: EstadoPedido,
    items: ItemPedido[],
    private readonly _createdAt: Date,
    private readonly _direccion: DireccionPedido | null,
  ) {
    this._items = items;
  }

  /** Crea un pedido nuevo en estado BORRADOR. */
  static crear(
    id: string,
    mesaId: string | null,
    tipo: TipoPedido,
    direccion: DireccionPedido | null = null,
  ): Pedido {
    return new Pedido(
      id,
      mesaId,
      tipo,
      EstadoPedido.BORRADOR,
      [],
      new Date(),
      direccion,
    );
  }

  /** Reconstituye un pedido existente desde la persistencia (sin eventos). */
  static reconstituir(params: {
    id: string;
    mesaId: string | null;
    tipo: TipoPedido;
    estado: EstadoPedido;
    items: ItemPedido[];
    createdAt: Date;
    direccion: DireccionPedido | null;
  }): Pedido {
    return new Pedido(
      params.id,
      params.mesaId,
      params.tipo,
      params.estado,
      params.items,
      params.createdAt,
      params.direccion,
    );
  }

  agregarItem(item: ItemPedido): void {
    if (this._estado !== EstadoPedido.BORRADOR) {
      throw new PedidoYaConfirmadoException(this._id);
    }
    this._items.push(item);
  }

  confirmar(): void {
    if (this._estado !== EstadoPedido.BORRADOR) {
      throw new TransicionInvalidaException(
        this._estado,
        EstadoPedido.CONFIRMADO,
      );
    }
    if (this._items.length === 0) {
      throw new PedidoVacioException(this._id);
    }
    this._estado = EstadoPedido.CONFIRMADO;
    this._eventos.push(
      new PedidoConfirmado(
        this._id,
        this._mesaId,
        this._tipo,
        this._items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
        })),
        this.total(),
        new Date(),
        this._direccion,
      ),
    );
  }

  iniciarPreparacion(): void {
    if (this._estado !== EstadoPedido.CONFIRMADO) {
      throw new TransicionInvalidaException(
        this._estado,
        EstadoPedido.EN_PREPARACION,
      );
    }
    this._estado = EstadoPedido.EN_PREPARACION;
  }

  /**
   * Reaccion de Pedidos al evento PedidoListo publicado por Cocina (unico
   * emisor canonico de ese evento). Solo transiciona el estado; NO reemite
   * el evento, para no duplicar su publicacion en el EventBus.
   */
  marcarListo(): void {
    if (this._estado !== EstadoPedido.EN_PREPARACION) {
      throw new TransicionInvalidaException(this._estado, EstadoPedido.LISTO);
    }
    this._estado = EstadoPedido.LISTO;
  }

  marcarPagado(): void {
    if (this._estado !== EstadoPedido.LISTO) {
      throw new TransicionInvalidaException(this._estado, EstadoPedido.PAGADO);
    }
    this._estado = EstadoPedido.PAGADO;
  }

  cancelar(motivo: string): void {
    if (this._estado !== EstadoPedido.CONFIRMADO) {
      throw new TransicionInvalidaException(
        this._estado,
        EstadoPedido.CANCELADO,
      );
    }
    this._estado = EstadoPedido.CANCELADO;
    this._eventos.push(new PedidoCancelado(this._id, motivo, new Date()));
  }

  private total(): Dinero {
    return this._items.reduce(
      (acc, item) => acc.sumar(item.subtotal()),
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

  get tipo(): TipoPedido {
    return this._tipo;
  }

  get estado(): EstadoPedido {
    return this._estado;
  }

  get items(): ReadonlyArray<ItemPedido> {
    return this._items;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get direccion(): DireccionPedido | null {
    return this._direccion;
  }
}
