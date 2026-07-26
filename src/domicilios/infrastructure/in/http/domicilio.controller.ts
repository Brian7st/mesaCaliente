import { Controller, Get, Inject, Param, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DireccionResponseDto,
  DomicilioResponseDto,
} from './dto/domicilio-response.dto';
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
  @ApiOperation({ summary: 'Lista los domicilios con su estado de entrega' })
  @ApiResponse({ status: 200, type: [DomicilioResponseDto] })
  async listar(): Promise<DomicilioResponseDto[]> {
    const domicilios = await this.repo.listar();
    return domicilios.map((domicilio) => this.mapearADto(domicilio));
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
