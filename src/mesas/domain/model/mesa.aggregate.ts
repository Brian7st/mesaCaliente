import { EstadoMesa } from './estado-mesa.vo';
import { NumeroMesa } from './numero-mesa.vo';
import {
  MesaYaLibreException,
  MesaYaOcupadaException,
} from '../exceptions/mesa.exceptions';

/**
 * Aggregate Root del Bounded Context Mesas (Supporting). Su estado refleja la
 * ocupacion del salon. No publica eventos: solo reacciona (ocupar/liberar).
 */
export class Mesa {
  private constructor(
    private readonly _id: string,
    private readonly _numero: NumeroMesa,
    private _estado: EstadoMesa,
  ) {}

  static crear(id: string, numero: NumeroMesa): Mesa {
    return new Mesa(id, numero, EstadoMesa.LIBRE);
  }

  static reconstituir(params: {
    id: string;
    numero: NumeroMesa;
    estado: EstadoMesa;
  }): Mesa {
    return new Mesa(params.id, params.numero, params.estado);
  }

  ocupar(): void {
    if (this._estado === EstadoMesa.OCUPADA) {
      throw new MesaYaOcupadaException(this._id);
    }
    this._estado = EstadoMesa.OCUPADA;
  }

  liberar(): void {
    if (this._estado === EstadoMesa.LIBRE) {
      throw new MesaYaLibreException(this._id);
    }
    this._estado = EstadoMesa.LIBRE;
  }

  get id(): string {
    return this._id;
  }

  get numero(): NumeroMesa {
    return this._numero;
  }

  get estado(): EstadoMesa {
    return this._estado;
  }
}
