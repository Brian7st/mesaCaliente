import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PedidoController } from './infrastructure/in/http/pedido.controller';
import { CrearPedidoHandler } from './application/commands/crear-pedido/crear-pedido.handler';
import { AgregarItemHandler } from './application/commands/agregar-item/agregar-item.handler';
import { ConfirmarPedidoHandler } from './application/commands/confirmar-pedido/confirmar-pedido.handler';
import { OnStockReservadoHandler } from './application/event-handlers/on-stock-reservado.handler';
import { OnReservaStockFallidaHandler } from './application/event-handlers/on-reserva-stock-fallida.handler';
import { OnPedidoListoHandler } from './application/event-handlers/on-pedido-listo.handler';
import { OnPagoRegistradoHandler } from './application/event-handlers/on-pago-registrado.handler';
import { OnPlatoCreadoHandler } from './application/event-handlers/on-plato-creado.handler';
import { OnPrecioActualizadoHandler } from './application/event-handlers/on-precio-actualizado.handler';
import { OnDisponibilidadCambiadaHandler } from './application/event-handlers/on-disponibilidad-cambiada.handler';
import { PedidoRepositoryPrisma } from './infrastructure/out/persistence/pedido.repository.prisma';
import { CatalogoPlatosRepositoryPrisma } from './infrastructure/out/persistence/catalogo-platos.repository.prisma';

const CommandHandlers = [
  CrearPedidoHandler,
  AgregarItemHandler,
  ConfirmarPedidoHandler,
];

const EventHandlers = [
  OnStockReservadoHandler,
  OnReservaStockFallidaHandler,
  OnPedidoListoHandler,
  OnPagoRegistradoHandler,
  OnPlatoCreadoHandler,
  OnPrecioActualizadoHandler,
  OnDisponibilidadCambiadaHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [PedidoController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'PedidoRepository', useClass: PedidoRepositoryPrisma },
    {
      provide: 'CatalogoPlatosRepository',
      useClass: CatalogoPlatosRepositoryPrisma,
    },
  ],
})
export class PedidosModule {}
