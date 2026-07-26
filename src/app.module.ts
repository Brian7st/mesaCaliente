import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { OutboxModule } from './shared/infrastructure/outbox/outbox.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { MesasModule } from './mesas/mesas.module';
import { CocinaModule } from './cocina/cocina.module';
import { InventarioModule } from './inventario/inventario.module';

/**
 * Composition Root global. Importa el modulo global de Prisma y los modulos
 * de cada Bounded Context a medida que se implementan.
 */
@Module({
  imports: [
    PrismaModule,
    OutboxModule,
    PedidosModule,
    MesasModule,
    CocinaModule,
    InventarioModule,
  ],
})
export class AppModule {}
