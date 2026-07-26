import { ApiProperty } from '@nestjs/swagger';
import { MetaPaginacionDto } from '../../../../../shared/infrastructure/http/meta-paginacion.dto';

export class MovimientoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  productoId: string;

  @ApiProperty({
    enum: ['ENTRADA', 'SALIDA', 'RESERVA', 'LIBERACION'],
    example: 'ENTRADA',
  })
  tipo: string;

  @ApiProperty({ description: 'Unidades del movimiento', example: 5 })
  cantidad: number;

  @ApiProperty({
    description: 'Motivo o referencia (pedidoId en reservas/consumos)',
    example: 'Merma por vencimiento',
    required: false,
    nullable: true,
  })
  motivo?: string;

  @ApiProperty({ example: '2026-07-26T12:00:00.000Z' })
  fecha: Date;
}

export class MovimientosPaginadosDto {
  @ApiProperty({ type: [MovimientoResponseDto] })
  data: MovimientoResponseDto[];

  @ApiProperty({ type: MetaPaginacionDto })
  meta: MetaPaginacionDto;
}
