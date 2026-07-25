import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { CrearMesaDto } from './dto/crear-mesa.dto';
import { MesaResponseDto } from './dto/mesa-response.dto';
import { CrearMesaCommand } from '../../../application/commands/crear-mesa/crear-mesa.command';
import { LiberarMesaCommand } from '../../../application/commands/liberar-mesa/liberar-mesa.command';
import { MesaRepository } from '../../../domain/ports/out/mesa.repository';
import { Mesa } from '../../../domain/model/mesa.aggregate';

@ApiTags('Mesas')
@Controller('mesas')
export class MesaController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('MesaRepository') private readonly repo: MesaRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea una nueva mesa en estado LIBRE' })
  @ApiResponse({ status: 201, description: 'Mesa creada', type: MesaResponseDto })
  @ApiResponse({ status: 400, description: 'Numero invalido o ya existente' })
  async crear(@Body() dto: CrearMesaDto): Promise<MesaResponseDto> {
    const mesaId = randomUUID();
    await this.commandBus.execute(new CrearMesaCommand(mesaId, dto.numero));
    const mesa = await this.repo.buscarPorId(mesaId);
    return this.mapearADto(mesa!);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas las mesas con su estado' })
  @ApiResponse({ status: 200, type: [MesaResponseDto] })
  async listar(): Promise<MesaResponseDto[]> {
    const mesas = await this.repo.listar();
    return mesas.map((mesa) => this.mapearADto(mesa));
  }

  @Patch(':id/liberar')
  @ApiOperation({ summary: 'Libera una mesa manualmente (OCUPADA -> LIBRE)' })
  @ApiResponse({ status: 200, description: 'Mesa liberada', type: MesaResponseDto })
  @ApiResponse({ status: 400, description: 'La mesa ya esta LIBRE' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  async liberar(@Param('id') id: string): Promise<MesaResponseDto> {
    await this.commandBus.execute(new LiberarMesaCommand(id));
    const mesa = await this.repo.buscarPorId(id);
    return this.mapearADto(mesa!);
  }

  private mapearADto(mesa: Mesa): MesaResponseDto {
    const dto = new MesaResponseDto();
    dto.id = mesa.id;
    dto.numero = mesa.numero.valor;
    dto.estado = mesa.estado;
    return dto;
  }
}
