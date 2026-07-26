import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PlatoController } from './infrastructure/in/http/plato.controller';
import { CrearPlatoHandler } from './application/commands/crear-plato/crear-plato.handler';
import { ActualizarPrecioHandler } from './application/commands/actualizar-precio/actualizar-precio.handler';
import { CambiarDisponibilidadHandler } from './application/commands/cambiar-disponibilidad/cambiar-disponibilidad.handler';
import { DefinirRecetaHandler } from './application/commands/definir-receta/definir-receta.handler';
import { PlatoRepositoryPrisma } from './infrastructure/out/persistence/plato.repository.prisma';

const CommandHandlers = [
  CrearPlatoHandler,
  ActualizarPrecioHandler,
  CambiarDisponibilidadHandler,
  DefinirRecetaHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [PlatoController],
  providers: [
    ...CommandHandlers,
    { provide: 'PlatoRepository', useClass: PlatoRepositoryPrisma },
  ],
})
export class CartaModule {}
