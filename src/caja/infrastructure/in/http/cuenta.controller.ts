import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CuentaResponseDto,
  LineaCuentaResponseDto,
} from './dto/cuenta-response.dto';
import { RegistrarPagoCommand } from '../../../application/commands/registrar-pago/registrar-pago.command';
import { CuentaRepository } from '../../../domain/ports/out/cuenta.repository';
import { Cuenta } from '../../../domain/model/cuenta.aggregate';

@ApiTags('Caja')
@Controller('caja/cuentas')
export class CuentaController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('CuentaRepository') private readonly repo: CuentaRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista las cuentas con sus lineas y total' })
  @ApiResponse({ status: 200, type: [CuentaResponseDto] })
  async listar(): Promise<CuentaResponseDto[]> {
    const cuentas = await this.repo.listar();
    return cuentas.map((cuenta) => this.mapearADto(cuenta));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene una cuenta por su ID' })
  @ApiResponse({ status: 200, type: CuentaResponseDto })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async obtener(@Param('id') id: string): Promise<CuentaResponseDto> {
    const cuenta = await this.repo.buscarPorId(id);
    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    return this.mapearADto(cuenta);
  }

  @Post(':id/pagar')
  @ApiOperation({ summary: 'Registra el pago de una cuenta (ABIERTA -> PAGADA)' })
  @ApiResponse({ status: 201, description: 'Cuenta pagada', type: CuentaResponseDto })
  @ApiResponse({ status: 400, description: 'La cuenta ya fue pagada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async pagar(@Param('id') id: string): Promise<CuentaResponseDto> {
    await this.commandBus.execute(new RegistrarPagoCommand(id));
    const cuenta = await this.repo.buscarPorId(id);
    return this.mapearADto(cuenta!);
  }

  private mapearADto(cuenta: Cuenta): CuentaResponseDto {
    const dto = new CuentaResponseDto();
    dto.id = cuenta.id;
    dto.mesaId = cuenta.mesaId;
    dto.estado = cuenta.estado;
    dto.total = cuenta.total().monto;
    dto.lineas = cuenta.lineas.map((linea) => {
      const lineaDto = new LineaCuentaResponseDto();
      lineaDto.pedidoId = linea.pedidoId;
      lineaDto.total = linea.total.monto;
      return lineaDto;
    });
    return dto;
  }
}
