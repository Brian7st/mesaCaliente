import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CuentaController } from './infrastructure/in/http/cuenta.controller';
import { RegistrarPagoHandler } from './application/commands/registrar-pago/registrar-pago.handler';
import { OnPedidoConfirmadoHandler } from './application/event-handlers/on-pedido-confirmado.handler';
import { OnPedidoCanceladoHandler } from './application/event-handlers/on-pedido-cancelado.handler';
import { CuentaRepositoryPrisma } from './infrastructure/out/persistence/cuenta.repository.prisma';

const CommandHandlers = [RegistrarPagoHandler];
const EventHandlers = [OnPedidoConfirmadoHandler, OnPedidoCanceladoHandler];

@Module({
  imports: [CqrsModule],
  controllers: [CuentaController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'CuentaRepository', useClass: CuentaRepositoryPrisma },
  ],
})
export class CajaModule {}
