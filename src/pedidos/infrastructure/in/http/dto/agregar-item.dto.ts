import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString } from 'class-validator';

export class AgregarItemDto {
  @ApiProperty({ description: 'ID del producto', example: 'prod-abc-123' })
  @IsString()
  productoId: string;

  @ApiProperty({ description: 'Cantidad de unidades', example: 2 })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({
    description: 'Precio unitario en COP (pesos enteros)',
    example: 15000,
  })
  @IsInt()
  @IsPositive()
  precioUnitario: number;
}
