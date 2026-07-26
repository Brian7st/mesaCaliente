import { ApiProperty } from '@nestjs/swagger';
import { MetaPaginacionDto } from '../../../../../shared/infrastructure/http/meta-paginacion.dto';

export class ItemOrdenResponseDto {
  @ApiProperty({ example: 'plato-abc-123' })
  platoId: string;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: false })
  preparado: boolean;

  @ApiProperty({ example: 'Sin cebolla', required: false, nullable: true })
  observacion?: string;
}

export class OrdenCocinaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'ped-1234' })
  pedidoId: string;

  @ApiProperty({
    enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTA', 'DESCARTADA'],
    example: 'PENDIENTE',
  })
  estado: string;

  @ApiProperty({ example: 'Todo junto por favor', required: false, nullable: true })
  observacion?: string;

  @ApiProperty({ type: [ItemOrdenResponseDto] })
  items: ItemOrdenResponseDto[];
}

export class OrdenesCocinaPaginadasDto {
  @ApiProperty({ type: [OrdenCocinaResponseDto] })
  data: OrdenCocinaResponseDto[];

  @ApiProperty({ type: MetaPaginacionDto })
  meta: MetaPaginacionDto;
}
