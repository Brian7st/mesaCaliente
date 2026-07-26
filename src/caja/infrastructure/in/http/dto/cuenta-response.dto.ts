import { ApiProperty } from '@nestjs/swagger';
import { MetaPaginacionDto } from '../../../../../shared/infrastructure/http/meta-paginacion.dto';

export class LineaCuentaResponseDto {
  @ApiProperty({ example: 'ped-abc-123' })
  pedidoId: string;

  @ApiProperty({ description: 'Total del pedido en COP', example: 30000 })
  total: number;
}

export class CuentaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({
    description: 'Mesa asociada (null para domicilios)',
    example: 'mesa-01',
    nullable: true,
  })
  mesaId: string | null;

  @ApiProperty({ enum: ['ABIERTA', 'PAGADA'], example: 'ABIERTA' })
  estado: string;

  @ApiProperty({ type: [LineaCuentaResponseDto] })
  lineas: LineaCuentaResponseDto[];

  @ApiProperty({ description: 'Total de la cuenta en COP', example: 45000 })
  total: number;
}

export class CuentasPaginadasDto {
  @ApiProperty({ type: [CuentaResponseDto] })
  data: CuentaResponseDto[];

  @ApiProperty({ type: MetaPaginacionDto })
  meta: MetaPaginacionDto;
}
