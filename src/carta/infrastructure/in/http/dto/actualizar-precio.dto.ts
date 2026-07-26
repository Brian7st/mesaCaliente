import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ActualizarPrecioDto {
  @ApiProperty({ description: 'Nuevo precio de venta en COP', example: 27000 })
  @IsInt()
  @Min(0)
  precio: number;
}
