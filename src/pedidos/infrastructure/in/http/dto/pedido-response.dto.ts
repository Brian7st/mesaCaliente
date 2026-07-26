import { ApiProperty } from '@nestjs/swagger';
import { MetaPaginacionDto } from '../../../../../shared/infrastructure/http/meta-paginacion.dto';

export class ItemPedidoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'plato-abc-123' })
  platoId: string;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario en COP (snapshot)', example: 25000 })
  precioUnitario: number;

  @ApiProperty({ example: 'Sin cebolla', required: false, nullable: true })
  observacion?: string;
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

  @ApiProperty({ example: 'Todo junto por favor', required: false, nullable: true })
  observacion?: string;
}

export class PedidosPaginadosDto {
  @ApiProperty({ type: [PedidoResponseDto] })
  data: PedidoResponseDto[];

  @ApiProperty({ type: MetaPaginacionDto })
  meta: MetaPaginacionDto;
}
