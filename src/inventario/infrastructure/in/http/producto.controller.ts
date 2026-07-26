import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { ReponerStockDto } from './dto/reponer-stock.dto';
import {
  ProductoResponseDto,
  ProductosPaginadosDto,
} from './dto/producto-response.dto';
import {
  construirMeta,
  resolverPaginacion,
} from '../../../../shared/infrastructure/http/paginacion';
import { CrearProductoCommand } from '../../../application/commands/crear-producto/crear-producto.command';
import { ReponerStockCommand } from '../../../application/commands/reponer-stock/reponer-stock.command';
import { ProductoRepository } from '../../../domain/ports/out/producto.repository';
import { Producto } from '../../../domain/model/producto.aggregate';

@ApiTags('Inventario')
@Controller('inventario/productos')
export class ProductoController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('ProductoRepository')
    private readonly repo: ProductoRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un producto con stock inicial' })
  @ApiResponse({ status: 201, description: 'Producto creado', type: ProductoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  async crear(@Body() dto: CrearProductoDto): Promise<ProductoResponseDto> {
    const productoId = randomUUID();
    await this.commandBus.execute(
      new CrearProductoCommand(productoId, dto.nombre, dto.stockInicial),
    );
    const producto = await this.repo.buscarPorId(productoId);
    return this.mapearADto(producto!);
  }

  @Get()
  @ApiOperation({ summary: 'Lista paginada de productos con su stock' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, type: ProductosPaginadosDto })
  async listar(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ProductosPaginadosDto> {
    const paginacion = resolverPaginacion(page, limit);
    const pagina = await this.repo.listar(paginacion);
    return {
      data: pagina.items.map((producto) => this.mapearADto(producto)),
      meta: construirMeta(pagina.total, pagina.page, pagina.limit),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un producto por su ID' })
  @ApiResponse({ status: 200, type: ProductoResponseDto })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async obtener(@Param('id') id: string): Promise<ProductoResponseDto> {
    const producto = await this.repo.buscarPorId(id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.mapearADto(producto);
  }

  @Patch(':id/reponer')
  @ApiOperation({ summary: 'Repone stock a un producto' })
  @ApiResponse({ status: 200, description: 'Stock repuesto', type: ProductoResponseDto })
  @ApiResponse({ status: 400, description: 'Cantidad invalida' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async reponer(
    @Param('id') id: string,
    @Body() dto: ReponerStockDto,
  ): Promise<ProductoResponseDto> {
    await this.commandBus.execute(new ReponerStockCommand(id, dto.cantidad));
    const producto = await this.repo.buscarPorId(id);
    return this.mapearADto(producto!);
  }

  private mapearADto(producto: Producto): ProductoResponseDto {
    const dto = new ProductoResponseDto();
    dto.id = producto.id;
    dto.nombre = producto.nombre;
    dto.stock = producto.stock.valor;
    dto.stockReservado = producto.stockReservado.valor;
    dto.disponible = producto.stock.valor - producto.stockReservado.valor;
    return dto;
  }
}
