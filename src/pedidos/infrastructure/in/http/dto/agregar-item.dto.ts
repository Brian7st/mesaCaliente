import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class AgregarItemDto {
  @ApiProperty({ description: 'ID del plato de la carta', example: 'plato-abc-123' })
  @IsString()
  platoId: string;

  @ApiProperty({ description: 'Cantidad de unidades', example: 2 })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({
    description: 'Observacion para cocina (ej. sin cebolla)',
    example: 'Sin cebolla',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacion?: string;
}
