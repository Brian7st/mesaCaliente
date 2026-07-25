import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Modulo global: expone PrismaService a todos los Bounded Contexts sin que
 * cada uno tenga que importarlo ni crear una conexion propia.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
