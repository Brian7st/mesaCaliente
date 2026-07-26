import { CategoriaPlato } from '../../../domain/model/categoria-plato.vo';

export class CrearPlatoCommand {
  constructor(
    readonly platoId: string,
    readonly nombre: string,
    readonly precio: number,
    readonly categoria: CategoriaPlato,
  ) {}
}
