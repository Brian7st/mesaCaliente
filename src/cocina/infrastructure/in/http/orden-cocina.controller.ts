import { Controller, Get, Inject, Param, Patch, Query } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdenCocinaResponseDto, ItemOrdenResponseDto } from './dto/orden-cocina-response.dto';
import { IniciarPreparacionCommand } from '../../../application/commands/iniciar-preparacion/iniciar-preparacion.command';
import { MarcarItemPreparadoCommand } from '../../../application/commands/marcar-item-preparado/marcar-item-preparado.command';
import { FinalizarOrdenCommand } from '../../../application/commands/finalizar-orden/finalizar-orden.command';
import { OrdenCocinaRepository } from '../../../domain/ports/out/orden-cocina.repository';
import { OrdenCocina } from '../../../domain/model/orden-cocina.aggregate';
import { EstadoOrdenCocina } from '../../../domain/model/estado-orden-cocina.vo';

@ApiTags('Cocina')
@Controller('cocina/ordenes')
export class OrdenCocinaController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('OrdenCocinaRepository')
    private readonly repo: OrdenCocinaRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista las ordenes de cocina, filtro opcional por estado' })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTA'],
  })
  @ApiResponse({ status: 200, type: [OrdenCocinaResponseDto] })
  async listar(
    @Query('estado') estado?: EstadoOrdenCocina,
  ): Promise<OrdenCocinaResponseDto[]> {
    const ordenes = await this.repo.listar(estado);
    return ordenes.map((orden) => this.mapearADto(orden));
  }

  @Patch(':id/iniciar')
  @ApiOperation({ summary: 'Inicia la preparacion (PENDIENTE -> EN_PREPARACION)' })
  @ApiResponse({ status: 200, type: OrdenCocinaResponseDto })
  @ApiResponse({ status: 400, description: 'Transicion invalida' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async iniciar(@Param('id') id: string): Promise<OrdenCocinaResponseDto> {
    await this.commandBus.execute(new IniciarPreparacionCommand(id));
    const orden = await this.repo.buscarPorId(id);
    return this.mapearADto(orden!);
  }

  @Patch(':id/items/:productoId/preparar')
  @ApiOperation({ summary: 'Marca un item de la orden como preparado' })
  @ApiResponse({ status: 200, type: OrdenCocinaResponseDto })
  @ApiResponse({ status: 404, description: 'Orden o item no encontrado' })
  async prepararItem(
    @Param('id') id: string,
    @Param('productoId') productoId: string,
  ): Promise<OrdenCocinaResponseDto> {
    await this.commandBus.execute(
      new MarcarItemPreparadoCommand(id, productoId),
    );
    const orden = await this.repo.buscarPorId(id);
    return this.mapearADto(orden!);
  }

  @Patch(':id/finalizar')
  @ApiOperation({ summary: 'Finaliza la orden (exige todos los items preparados)' })
  @ApiResponse({ status: 200, type: OrdenCocinaResponseDto })
  @ApiResponse({ status: 400, description: 'Hay items sin preparar o transicion invalida' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  async finalizar(@Param('id') id: string): Promise<OrdenCocinaResponseDto> {
    await this.commandBus.execute(new FinalizarOrdenCommand(id));
    const orden = await this.repo.buscarPorId(id);
    return this.mapearADto(orden!);
  }

  private mapearADto(orden: OrdenCocina): OrdenCocinaResponseDto {
    const dto = new OrdenCocinaResponseDto();
    dto.id = orden.id;
    dto.pedidoId = orden.pedidoId;
    dto.estado = orden.estado;
    dto.items = orden.items.map((item) => {
      const itemDto = new ItemOrdenResponseDto();
      itemDto.productoId = item.productoId;
      itemDto.cantidad = item.cantidad;
      itemDto.preparado = item.preparado;
      return itemDto;
    });
    return dto;
  }
}
