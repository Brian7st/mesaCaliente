import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarDisponibilidadDto {
  @ApiProperty({ description: 'Disponibilidad del plato', example: false })
  @IsBoolean()
  disponible: boolean;
}
