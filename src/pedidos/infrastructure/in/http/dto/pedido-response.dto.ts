import { ApiProperty } from '@nestjs/swagger';

export class ItemPedidoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'prod-abc-123' })
  productoId: string;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario en COP', example: 15000 })
  precioUnitario: number;
}

export class PedidoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({
    description: 'ID de la mesa asociada (null si es domicilio sin mesa)',
    example: 'mesa-01',
    nullable: true,
  })
  mesaId: string | null;

  @ApiProperty({ enum: ['LOCAL', 'DOMICILIO'], example: 'LOCAL' })
  tipo: string;

  @ApiProperty({
    enum: [
      'BORRADOR',
      'CONFIRMADO',
      'EN_PREPARACION',
      'LISTO',
      'PAGADO',
      'CANCELADO',
    ],
    example: 'BORRADOR',
  })
  estado: string;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  items: ItemPedidoResponseDto[];

  @ApiProperty({ example: '2026-07-25T12:00:00.000Z' })
  createdAt: Date;
}
