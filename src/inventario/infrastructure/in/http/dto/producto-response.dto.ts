import { ApiProperty } from '@nestjs/swagger';

export class ProductoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Hamburguesa clasica' })
  nombre: string;

  @ApiProperty({ description: 'Stock total', example: 100 })
  stock: number;

  @ApiProperty({ description: 'Stock reservado por pedidos confirmados', example: 12 })
  stockReservado: number;

  @ApiProperty({ description: 'Stock disponible (stock - reservado)', example: 88 })
  disponible: number;
}
