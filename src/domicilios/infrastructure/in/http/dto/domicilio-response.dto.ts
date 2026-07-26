import { ApiProperty } from '@nestjs/swagger';
import { MetaPaginacionDto } from '../../../../../shared/infrastructure/http/meta-paginacion.dto';

export class DireccionResponseDto {
  @ApiProperty({ example: 'Cra 7 # 45-12' })
  calle: string;

  @ApiProperty({ example: 'Bogota' })
  ciudad: string;

  @ApiProperty({ example: 'Apto 302', required: false, nullable: true })
  referencia?: string;
}

export class DomicilioResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'ped-abc-123' })
  pedidoId: string;

  @ApiProperty({ type: DireccionResponseDto })
  direccion: DireccionResponseDto;

  @ApiProperty({
    enum: ['ASIGNADO', 'EN_CAMINO', 'ENTREGADO'],
    example: 'ASIGNADO',
  })
  estado: string;
}

export class DomiciliosPaginadosDto {
  @ApiProperty({ type: [DomicilioResponseDto] })
  data: DomicilioResponseDto[];

  @ApiProperty({ type: MetaPaginacionDto })
  meta: MetaPaginacionDto;
}
