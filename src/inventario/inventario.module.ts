import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductoController } from './infrastructure/in/http/producto.controller';
import { CrearProductoHandler } from './application/commands/crear-producto/crear-producto.handler';
import { ReponerStockHandler } from './application/commands/reponer-stock/reponer-stock.handler';
import { RegistrarSalidaHandler } from './application/commands/registrar-salida/registrar-salida.handler';
import { OnInsumosRequeridosHandler } from './application/event-handlers/on-insumos-requeridos.handler';
import { OnPedidoListoHandler } from './application/event-handlers/on-pedido-listo.handler';
import { OnPedidoCanceladoHandler } from './application/event-handlers/on-pedido-cancelado.handler';
import { ProductoRepositoryPrisma } from './infrastructure/out/persistence/producto.repository.prisma';
import { ReservaInsumoRepositoryPrisma } from './infrastructure/out/persistence/reserva-insumo.repository.prisma';

const CommandHandlers = [
  CrearProductoHandler,
  ReponerStockHandler,
  RegistrarSalidaHandler,
];
const EventHandlers = [
  OnInsumosRequeridosHandler,
  OnPedidoListoHandler,
  OnPedidoCanceladoHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ProductoController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'ProductoRepository', useClass: ProductoRepositoryPrisma },
    {
      provide: 'ReservaInsumoRepository',
      useClass: ReservaInsumoRepositoryPrisma,
    },
  ],
})
export class InventarioModule {}
