import { Dinero } from './dinero.vo';
import { CategoriaPlato } from './categoria-plato.vo';
import { LineaReceta } from './linea-receta.entity';
import { PlatoSinNombreException } from '../exceptions/plato.exceptions';
import { PlatoCreado } from '../events/plato-creado.event';
import { PrecioActualizado } from '../events/precio-actualizado.event';
import { DisponibilidadCambiada } from '../events/disponibilidad-cambiada.event';

/**
 * Aggregate Root del Bounded Context Carta. Un plato es lo que el cliente pide:
 * tiene precio de venta propio (lo duena el sistema, no el request) y una
 * receta que declara cuantos insumos de Inventario consume.
 */
export class Plato {
  private _receta: LineaReceta[];
  private readonly _eventos: object[] = [];

  private constructor(
    private readonly _id: string,
    private readonly _nombre: string,
    private _precio: Dinero,
    private readonly _categoria: CategoriaPlato,
    private _disponible: boolean,
    receta: LineaReceta[],
  ) {
    this._receta = receta;
  }

  static crear(
    id: string,
    nombre: string,
    precio: Dinero,
    categoria: CategoriaPlato,
  ): Plato {
    if (!nombre || nombre.trim().length === 0) {
      throw new PlatoSinNombreException();
    }
    const plato = new Plato(id, nombre, precio, categoria, true, []);
    plato._eventos.push(
      new PlatoCreado(id, nombre, precio, true, new Date()),
    );
    return plato;
  }

  static reconstituir(params: {
    id: string;
    nombre: string;
    precio: Dinero;
    categoria: CategoriaPlato;
    disponible: boolean;
    receta: LineaReceta[];
  }): Plato {
    return new Plato(
      params.id,
      params.nombre,
      params.precio,
      params.categoria,
      params.disponible,
      params.receta,
    );
  }

  actualizarPrecio(precio: Dinero): void {
    this._precio = precio;
    this._eventos.push(new PrecioActualizado(this._id, precio, new Date()));
  }

  cambiarDisponibilidad(disponible: boolean): void {
    this._disponible = disponible;
    this._eventos.push(
      new DisponibilidadCambiada(this._id, disponible, new Date()),
    );
  }

  definirReceta(receta: LineaReceta[]): void {
    this._receta = receta;
  }

  obtenerEventos(): object[] {
    return [...this._eventos];
  }

  get id(): string {
    return this._id;
  }

  get nombre(): string {
    return this._nombre;
  }

  get precio(): Dinero {
    return this._precio;
  }

  get categoria(): CategoriaPlato {
    return this._categoria;
  }

  get disponible(): boolean {
    return this._disponible;
  }

  get receta(): ReadonlyArray<LineaReceta> {
    return this._receta;
  }
}
