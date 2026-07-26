import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class LineaRecetaDto {
  @ApiProperty({ description: 'ID del insumo (Producto de Inventario)', example: 'insumo-carne' })
  @IsString()
  insumoId: string;

  @ApiProperty({ description: 'Cantidad de insumo que consume el plato', example: 2 })
  @IsInt()
  @IsPositive()
  cantidad: number;
}

export class DefinirRecetaDto {
  @ApiProperty({ type: [LineaRecetaDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => LineaRecetaDto)
  receta: LineaRecetaDto[];
}
