import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MesaController } from './infrastructure/in/http/mesa.controller';
import { CrearMesaHandler } from './application/commands/crear-mesa/crear-mesa.handler';
import { LiberarMesaHandler } from './application/commands/liberar-mesa/liberar-mesa.handler';
import { OnPedidoConfirmadoHandler } from './application/event-handlers/on-pedido-confirmado.handler';
import { OnPagoRegistradoHandler } from './application/event-handlers/on-pago-registrado.handler';
import { MesaRepositoryPrisma } from './infrastructure/out/persistence/mesa.repository.prisma';

const CommandHandlers = [CrearMesaHandler, LiberarMesaHandler];
const EventHandlers = [OnPedidoConfirmadoHandler, OnPagoRegistradoHandler];

@Module({
  imports: [CqrsModule],
  controllers: [MesaController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'MesaRepository', useClass: MesaRepositoryPrisma },
  ],
})
export class MesasModule {}
