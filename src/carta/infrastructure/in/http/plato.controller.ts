import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CrearPlatoDto } from './dto/crear-plato.dto';
import { ActualizarPrecioDto } from './dto/actualizar-precio.dto';
import { CambiarDisponibilidadDto } from './dto/cambiar-disponibilidad.dto';
import { DefinirRecetaDto } from './dto/definir-receta.dto';
import {
  LineaRecetaResponseDto,
  PlatoResponseDto,
  PlatosPaginadosDto,
} from './dto/plato-response.dto';
import { CrearPlatoCommand } from '../../../application/commands/crear-plato/crear-plato.command';
import { ActualizarPrecioCommand } from '../../../application/commands/actualizar-precio/actualizar-precio.command';
import { CambiarDisponibilidadCommand } from '../../../application/commands/cambiar-disponibilidad/cambiar-disponibilidad.command';
import { DefinirRecetaCommand } from '../../../application/commands/definir-receta/definir-receta.command';
import { PlatoRepository } from '../../../domain/ports/out/plato.repository';
import { Plato } from '../../../domain/model/plato.aggregate';
import {
  construirMeta,
  resolverPaginacion,
} from '../../../../shared/infrastructure/http/paginacion';

@ApiTags('Carta')
@Controller('carta/platos')
export class PlatoController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('PlatoRepository') private readonly repo: PlatoRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un plato con su precio de venta' })
  @ApiResponse({ status: 201, description: 'Plato creado', type: PlatoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  async crear(@Body() dto: CrearPlatoDto): Promise<PlatoResponseDto> {
    const platoId = randomUUID();
    await this.commandBus.execute(
      new CrearPlatoCommand(platoId, dto.nombre, dto.precio, dto.categoria),
    );
    const plato = await this.repo.buscarPorId(platoId);
    return this.mapearADto(plato!);
  }

  @Get()
  @ApiOperation({ summary: 'Lista paginada de platos de la carta' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: PlatosPaginadosDto })
  async listar(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PlatosPaginadosDto> {
    const paginacion = resolverPaginacion(page, limit);
    const pagina = await this.repo.listar(paginacion);
    return {
      data: pagina.items.map((plato) => this.mapearADto(plato)),
      meta: construirMeta(pagina.total, pagina.page, pagina.limit),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un plato por su ID' })
  @ApiResponse({ status: 200, type: PlatoResponseDto })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async obtener(@Param('id') id: string): Promise<PlatoResponseDto> {
    const plato = await this.repo.buscarPorId(id);
    if (!plato) {
      throw new NotFoundException('Plato no encontrado');
    }
    return this.mapearADto(plato);
  }

  @Patch(':id/precio')
  @ApiOperation({ summary: 'Actualiza el precio de un plato' })
  @ApiResponse({ status: 200, type: PlatoResponseDto })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async actualizarPrecio(
    @Param('id') id: string,
    @Body() dto: ActualizarPrecioDto,
  ): Promise<PlatoResponseDto> {
    await this.commandBus.execute(new ActualizarPrecioCommand(id, dto.precio));
    const plato = await this.repo.buscarPorId(id);
    return this.mapearADto(plato!);
  }

  @Patch(':id/disponibilidad')
  @ApiOperation({ summary: 'Cambia la disponibilidad de un plato' })
  @ApiResponse({ status: 200, type: PlatoResponseDto })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async cambiarDisponibilidad(
    @Param('id') id: string,
    @Body() dto: CambiarDisponibilidadDto,
  ): Promise<PlatoResponseDto> {
    await this.commandBus.execute(
      new CambiarDisponibilidadCommand(id, dto.disponible),
    );
    const plato = await this.repo.buscarPorId(id);
    return this.mapearADto(plato!);
  }

  @Put(':id/receta')
  @ApiOperation({ summary: 'Define la receta (insumos que consume) de un plato' })
  @ApiResponse({ status: 200, type: PlatoResponseDto })
  @ApiResponse({ status: 400, description: 'Receta invalida' })
  @ApiResponse({ status: 404, description: 'Plato no encontrado' })
  async definirReceta(
    @Param('id') id: string,
    @Body() dto: DefinirRecetaDto,
  ): Promise<PlatoResponseDto> {
    await this.commandBus.execute(new DefinirRecetaCommand(id, dto.receta));
    const plato = await this.repo.buscarPorId(id);
    return this.mapearADto(plato!);
  }

  private mapearADto(plato: Plato): PlatoResponseDto {
    const dto = new PlatoResponseDto();
    dto.id = plato.id;
    dto.nombre = plato.nombre;
    dto.precio = plato.precio.monto;
    dto.categoria = plato.categoria;
    dto.disponible = plato.disponible;
    dto.receta = plato.receta.map((linea) => {
      const l = new LineaRecetaResponseDto();
      l.insumoId = linea.insumoId;
      l.cantidad = linea.cantidad;
      return l;
    });
    return dto;
  }
}
