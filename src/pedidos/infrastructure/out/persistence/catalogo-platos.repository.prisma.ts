import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  CatalogoPlatosRepository,
  PlatoCatalogo,
} from '../../../domain/ports/out/catalogo-platos.repository';

/**
 * Adaptador de la proyeccion local del catalogo (read-model alimentado por los
 * eventos de Carta). Los updates usan updateMany para ser no-op si el plato aun
 * no esta proyectado (robustez ante orden de eventos).
 */
@Injectable()
export class CatalogoPlatosRepositoryPrisma
  implements CatalogoPlatosRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorId(platoId: string): Promise<PlatoCatalogo | null> {
    const row = await this.prisma.platoCatalogo.findUnique({
      where: { platoId },
    });
    return row
      ? {
          platoId: row.platoId,
          nombre: row.nombre,
          precio: row.precio,
          disponible: row.disponible,
        }
      : null;
  }

  async guardarPlato(plato: PlatoCatalogo): Promise<void> {
    await this.prisma.platoCatalogo.upsert({
      where: { platoId: plato.platoId },
      create: plato,
      update: {
        nombre: plato.nombre,
        precio: plato.precio,
        disponible: plato.disponible,
      },
    });
  }

  async actualizarPrecio(platoId: string, precio: number): Promise<void> {
    await this.prisma.platoCatalogo.updateMany({
      where: { platoId },
      data: { precio },
    });
  }

  async actualizarDisponibilidad(
    platoId: string,
    disponible: boolean,
  ): Promise<void> {
    await this.prisma.platoCatalogo.updateMany({
      where: { platoId },
      data: { disponible },
    });
  }
}
