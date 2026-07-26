export class CambiarDisponibilidadCommand {
  constructor(
    readonly platoId: string,
    readonly disponible: boolean,
  ) {}
}
