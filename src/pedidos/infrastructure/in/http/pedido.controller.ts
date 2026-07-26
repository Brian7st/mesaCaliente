import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CrearPedidoDto } from './dto/crear-pedido.dto';
import { AgregarItemDto } from './dto/agregar-item.dto';
import {
  ItemPedidoResponseDto,
  PedidoResponseDto,
  PedidosPaginadosDto,
} from './dto/pedido-response.dto';
import {
  construirMeta,
  resolverPaginacion,
} from '../../../../shared/infrastructure/http/paginacion';
import { CrearPedidoCommand } from '../../../application/commands/crear-pedido/crear-pedido.command';
import { AgregarItemCommand } from '../../../application/commands/agregar-item/agregar-item.command';
import { ConfirmarPedidoCommand } from '../../../application/commands/confirmar-pedido/confirmar-pedido.command';
import { PedidoRepository } from '../../../domain/ports/out/pedido.repository';
import { Pedido } from '../../../domain/model/pedido.aggregate';
import { EstadoPedido } from '../../../domain/model/estado-pedido.vo';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidoController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('PedidoRepository') private readonly repo: PedidoRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo pedido en estado BORRADOR' })
  @ApiResponse({ status: 201, description: 'Pedido creado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  async crear(@Body() dto: CrearPedidoDto): Promise<PedidoResponseDto> {
    const pedidoId = randomUUID();
    await this.commandBus.execute(
      new CrearPedidoCommand(
        pedidoId,
        dto.mesaId ?? null,
        dto.tipo,
        dto.direccion ?? null,
        dto.observacion ?? null,
      ),
    );
    const pedido = await this.repo.buscarPorId(pedidoId);
    return this.mapearADto(pedido!);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Agrega un item a un pedido en BORRADOR' })
  @ApiResponse({ status: 201, description: 'Item agregado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'El pedido ya no esta en BORRADOR' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async agregarItem(
    @Param('id') id: string,
    @Body() dto: AgregarItemDto,
  ): Promise<PedidoResponseDto> {
    await this.commandBus.execute(
      new AgregarItemCommand(id, dto.platoId, dto.cantidad, dto.observacion),
    );
    const pedido = await this.repo.buscarPorId(id);
    return this.mapearADto(pedido!);
  }

  @Post(':id/confirmar')
  @ApiOperation({ summary: 'Confirma un pedido (BORRADOR -> CONFIRMADO)' })
  @ApiResponse({ status: 201, description: 'Pedido confirmado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Pedido sin items o ya confirmado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async confirmar(@Param('id') id: string): Promise<PedidoResponseDto> {
    await this.commandBus.execute(new ConfirmarPedidoCommand(id));
    const pedido = await this.repo.buscarPorId(id);
    return this.mapearADto(pedido!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un pedido por su ID' })
  @ApiResponse({ status: 200, type: PedidoResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async obtener(@Param('id') id: string): Promise<PedidoResponseDto> {
    const pedido = await this.repo.buscarPorId(id);
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return this.mapearADto(pedido);
  }

  @Get()
  @ApiOperation({ summary: 'Lista paginada de pedidos, con filtro opcional por estado' })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: [
      'BORRADOR',
      'CONFIRMADO',
      'EN_PREPARACION',
      'LISTO',
      'PAGADO',
      'CANCELADO',
    ],
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: PedidosPaginadosDto })
  async listar(
    @Query('estado') estado?: EstadoPedido,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PedidosPaginadosDto> {
    const paginacion = resolverPaginacion(page, limit);
    const pagina = await this.repo.listar(paginacion, estado);
    return {
      data: pagina.items.map((pedido) => this.mapearADto(pedido)),
      meta: construirMeta(pagina.total, pagina.page, pagina.limit),
    };
  }

  private mapearADto(pedido: Pedido): PedidoResponseDto {
    const dto = new PedidoResponseDto();
    dto.id = pedido.id;
    dto.mesaId = pedido.mesaId;
    dto.tipo = pedido.tipo;
    dto.estado = pedido.estado;
    dto.createdAt = pedido.createdAt;
    dto.observacion = pedido.observacion ?? undefined;
    dto.items = pedido.items.map((item) => {
      const itemDto = new ItemPedidoResponseDto();
      itemDto.id = item.id;
      itemDto.platoId = item.platoId;
      itemDto.cantidad = item.cantidad;
      itemDto.precioUnitario = item.precioUnitario.monto;
      itemDto.observacion = item.observacion;
      return itemDto;
    });
    return dto;
  }
}
