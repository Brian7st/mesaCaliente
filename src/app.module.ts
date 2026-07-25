import { Module } from '@nestjs/common';
import { PrismaService } from './shared/infrastructure/prisma/prisma.service';

/**
 * Composition Root global. A medida que se implementen los Bounded Contexts
 * (Pedidos, Mesas, Cocina, Inventario, Caja, Domicilios) se importan aca sus
 * respectivos modulos.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
