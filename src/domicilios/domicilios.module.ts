import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DomicilioController } from './infrastructure/in/http/domicilio.controller';
import { IniciarEntregaHandler } from './application/commands/iniciar-entrega/iniciar-entrega.handler';
import { ConfirmarEntregaHandler } from './application/commands/confirmar-entrega/confirmar-entrega.handler';
import { OnPedidoConfirmadoHandler } from './application/event-handlers/on-pedido-confirmado.handler';
import { DomicilioRepositoryPrisma } from './infrastructure/out/persistence/domicilio.repository.prisma';

const CommandHandlers = [IniciarEntregaHandler, ConfirmarEntregaHandler];
const EventHandlers = [OnPedidoConfirmadoHandler];

@Module({
  imports: [CqrsModule],
  controllers: [DomicilioController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'DomicilioRepository', useClass: DomicilioRepositoryPrisma },
  ],
})
export class DomiciliosModule {}
