import { EstadoOrdenCocina } from './estado-orden-cocina.vo';
import { ItemOrden } from './item-orden.entity';
import {
  ItemOrdenNoEncontradoException,
  OrdenCocinaIncompletaException,
  TransicionOrdenInvalidaException,
} from '../exceptions/orden-cocina.exceptions';
import { PedidoListo } from '../events/pedido-listo.event';

/**
 * Aggregate Root de Cocina, independiente de Pedido. Se crea reaccionando a
 * PedidoConfirmado y, al finalizar, publica PedidoListo (unico emisor).
 */
export class OrdenCocina {
  private readonly _items: ItemOrden[];
  private readonly _eventos: object[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _pedidoId: string,
    private _estado: EstadoOrdenCocina,
    items: ItemOrden[],
  ) {
    this._items = items;
  }

  static crear(
    id: string,
    pedidoId: string,
    items: { productoId: string; cantidad: number }[],
  ): OrdenCocina {
    return new OrdenCocina(
      id,
      pedidoId,
      EstadoOrdenCocina.PENDIENTE,
      items.map((i) => new ItemOrden(i.productoId, i.cantidad, false)),
    );
  }

  static reconstituir(params: {
    id: string;
    pedidoId: string;
    estado: EstadoOrdenCocina;
    items: ItemOrden[];
  }): OrdenCocina {
    return new OrdenCocina(
      params.id,
      params.pedidoId,
      params.estado,
      params.items,
    );
  }

  iniciarPreparacion(): void {
    if (this._estado !== EstadoOrdenCocina.PENDIENTE) {
      throw new TransicionOrdenInvalidaException(
        this._estado,
        EstadoOrdenCocina.EN_PREPARACION,
      );
    }
    this._estado = EstadoOrdenCocina.EN_PREPARACION;
  }

  marcarItemPreparado(productoId: string): void {
    const item = this._items.find((i) => i.productoId === productoId);
    if (!item) {
      throw new ItemOrdenNoEncontradoException(productoId);
    }
    item.preparar();
  }

  finalizar(): void {
    if (this._estado !== EstadoOrdenCocina.EN_PREPARACION) {
      throw new TransicionOrdenInvalidaException(
        this._estado,
        EstadoOrdenCocina.LISTA,
      );
    }
    if (!this._items.every((i) => i.preparado)) {
      throw new OrdenCocinaIncompletaException(this._id);
    }
    this._estado = EstadoOrdenCocina.LISTA;
    this._eventos.push(new PedidoListo(this._pedidoId, new Date()));
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

  get estado(): EstadoOrdenCocina {
    return this._estado;
  }

  get items(): ReadonlyArray<ItemOrden> {
    return this._items;
  }
}
