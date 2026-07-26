import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, IsNotEmpty } from 'class-validator';

export class CrearProductoDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Hamburguesa clasica' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Stock inicial (unidades)', example: 100 })
  @IsInt()
  @Min(0)
  stockInicial: number;
}
