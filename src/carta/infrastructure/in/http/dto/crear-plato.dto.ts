import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { CategoriaPlato } from '../../../../domain/model/categoria-plato.vo';

export class CrearPlatoDto {
  @ApiProperty({ description: 'Nombre del plato', example: 'Hamburguesa clasica' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Precio de venta en COP', example: 25000 })
  @IsInt()
  @Min(0)
  precio: number;

  @ApiProperty({ enum: CategoriaPlato, example: CategoriaPlato.PRINCIPAL })
  @IsEnum(CategoriaPlato)
  categoria: CategoriaPlato;
}
