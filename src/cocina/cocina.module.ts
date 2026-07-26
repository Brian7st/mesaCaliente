import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrdenCocinaController } from './infrastructure/in/http/orden-cocina.controller';
import { IniciarPreparacionHandler } from './application/commands/iniciar-preparacion/iniciar-preparacion.handler';
import { MarcarItemPreparadoHandler } from './application/commands/marcar-item-preparado/marcar-item-preparado.handler';
import { FinalizarOrdenHandler } from './application/commands/finalizar-orden/finalizar-orden.handler';
import { OnPedidoConfirmadoHandler } from './application/event-handlers/on-pedido-confirmado.handler';
import { OnPedidoCanceladoHandler } from './application/event-handlers/on-pedido-cancelado.handler';
import { OrdenCocinaRepositoryPrisma } from './infrastructure/out/persistence/orden-cocina.repository.prisma';

const CommandHandlers = [
  IniciarPreparacionHandler,
  MarcarItemPreparadoHandler,
  FinalizarOrdenHandler,
];
const EventHandlers = [OnPedidoConfirmadoHandler, OnPedidoCanceladoHandler];

@Module({
  imports: [CqrsModule],
  controllers: [OrdenCocinaController],
  providers: [
    ...CommandHandlers,
    ...EventHandlers,
    { provide: 'OrdenCocinaRepository', useClass: OrdenCocinaRepositoryPrisma },
  ],
})
export class CocinaModule {}
