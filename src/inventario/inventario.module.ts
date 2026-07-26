import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductoController } from './infrastructure/in/http/producto.controller';
import { CrearProductoHandler } from './application/commands/crear-producto/crear-producto.handler';
import { ReponerStockHandler } from './application/commands/reponer-stock/reponer-stock.handler';
import { OnPedidoConfirmadoHandler } from './application/event-handlers/on-pedido-confirmado.handler';
import { ProductoRepositoryPrisma } from './infrastructure/out/persistence/producto.repository.prisma';

const CommandHandlers = [CrearProductoHandler, ReponerStockHandler];
const EventHandlers = [OnPedidoConfirmadoHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ProductoController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'ProductoRepository', useClass: ProductoRepositoryPrisma },
  ],
})
export class InventarioModule {}
