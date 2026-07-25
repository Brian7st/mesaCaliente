import { ApiProperty } from '@nestjs/swagger';

export class ItemOrdenResponseDto {
  @ApiProperty({ example: 'prod-abc-123' })
  productoId: string;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: false })
  preparado: boolean;
}

export class OrdenCocinaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'ped-1234' })
  pedidoId: string;

  @ApiProperty({
    enum: ['PENDIENTE', 'EN_PREPARACION', 'LISTA'],
    example: 'PENDIENTE',
  })
  estado: string;

  @ApiProperty({ type: [ItemOrdenResponseDto] })
  items: ItemOrdenResponseDto[];
}
