import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PedidoController } from './infrastructure/in/http/pedido.controller';
import { CrearPedidoHandler } from './application/commands/crear-pedido/crear-pedido.handler';
import { AgregarItemHandler } from './application/commands/agregar-item/agregar-item.handler';
import { ConfirmarPedidoHandler } from './application/commands/confirmar-pedido/confirmar-pedido.handler';
import { OnStockReservadoHandler } from './application/event-handlers/on-stock-reservado.handler';
import { OnReservaStockFallidaHandler } from './application/event-handlers/on-reserva-stock-fallida.handler';
import { PedidoRepositoryPrisma } from './infrastructure/out/persistence/pedido.repository.prisma';

const CommandHandlers = [
  CrearPedidoHandler,
  AgregarItemHandler,
  ConfirmarPedidoHandler,
];

const EventHandlers = [OnStockReservadoHandler, OnReservaStockFallidaHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PedidoController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'PedidoRepository', useClass: PedidoRepositoryPrisma },
  ],
})
export class PedidosModule {}
