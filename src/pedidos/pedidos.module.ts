import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PedidoController } from './infrastructure/in/http/pedido.controller';
import { CrearPedidoHandler } from './application/commands/crear-pedido/crear-pedido.handler';
import { AgregarItemHandler } from './application/commands/agregar-item/agregar-item.handler';
import { ConfirmarPedidoHandler } from './application/commands/confirmar-pedido/confirmar-pedido.handler';
import { PedidoRepositoryPrisma } from './infrastructure/out/persistence/pedido.repository.prisma';

const CommandHandlers = [
  CrearPedidoHandler,
  AgregarItemHandler,
  ConfirmarPedidoHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [PedidoController],
  providers: [
    ...CommandHandlers,
    { provide: 'PedidoRepository', useClass: PedidoRepositoryPrisma },
  ],
})
export class PedidosModule {}
