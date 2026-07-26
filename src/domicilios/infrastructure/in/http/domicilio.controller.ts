import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DireccionResponseDto,
  DomicilioResponseDto,
  DomiciliosPaginadosDto,
} from './dto/domicilio-response.dto';
import {
  construirMeta,
  resolverPaginacion,
} from '../../../../shared/infrastructure/http/paginacion';
import { IniciarEntregaCommand } from '../../../application/commands/iniciar-entrega/iniciar-entrega.command';
import { ConfirmarEntregaCommand } from '../../../application/commands/confirmar-entrega/confirmar-entrega.command';
import { DomicilioRepository } from '../../../domain/ports/out/domicilio.repository';
import { Domicilio } from '../../../domain/model/domicilio.aggregate';

@ApiTags('Domicilios')
@Controller('domicilios')
export class DomicilioController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('DomicilioRepository')
    private readonly repo: DomicilioRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista paginada de domicilios con su estado de entrega' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: DomiciliosPaginadosDto })
  async listar(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<DomiciliosPaginadosDto> {
    const paginacion = resolverPaginacion(page, limit);
    const pagina = await this.repo.listar(paginacion);
    return {
      data: pagina.items.map((domicilio) => this.mapearADto(domicilio)),
      meta: construirMeta(pagina.total, pagina.page, pagina.limit),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un domicilio por su ID' })
  @ApiResponse({ status: 200, type: DomicilioResponseDto })
  @ApiResponse({ status: 404, description: 'Domicilio no encontrado' })
  async obtener(@Param('id') id: string): Promise<DomicilioResponseDto> {
    const domicilio = await this.repo.buscarPorId(id);
    if (!domicilio) {
      throw new NotFoundException('Domicilio no encontrado');
    }
    return this.mapearADto(domicilio);
  }

  @Patch(':id/iniciar-entrega')
  @ApiOperation({ summary: 'Inicia la entrega (ASIGNADO -> EN_CAMINO)' })
  @ApiResponse({ status: 200, type: DomicilioResponseDto })
  @ApiResponse({ status: 400, description: 'Transicion invalida' })
  @ApiResponse({ status: 404, description: 'Domicilio no encontrado' })
  async iniciarEntrega(@Param('id') id: string): Promise<DomicilioResponseDto> {
    await this.commandBus.execute(new IniciarEntregaCommand(id));
    const domicilio = await this.repo.buscarPorId(id);
    return this.mapearADto(domicilio!);
  }

  @Patch(':id/confirmar-entrega')
  @ApiOperation({ summary: 'Confirma la entrega (EN_CAMINO -> ENTREGADO)' })
  @ApiResponse({ status: 200, type: DomicilioResponseDto })
  @ApiResponse({ status: 400, description: 'Transicion invalida' })
  @ApiResponse({ status: 404, description: 'Domicilio no encontrado' })
  async confirmarEntrega(
    @Param('id') id: string,
  ): Promise<DomicilioResponseDto> {
    await this.commandBus.execute(new ConfirmarEntregaCommand(id));
    const domicilio = await this.repo.buscarPorId(id);
    return this.mapearADto(domicilio!);
  }

  private mapearADto(domicilio: Domicilio): DomicilioResponseDto {
    const dto = new DomicilioResponseDto();
    dto.id = domicilio.id;
    dto.pedidoId = domicilio.pedidoId;
    dto.estado = domicilio.estado;
    const direccion = new DireccionResponseDto();
    direccion.calle = domicilio.direccion.calle;
    direccion.ciudad = domicilio.direccion.ciudad;
    direccion.referencia = domicilio.direccion.referencia;
    dto.direccion = direccion;
    return dto;
  }
}
