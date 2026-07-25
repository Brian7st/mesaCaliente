import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CrearMesaDto {
  @ApiProperty({ description: 'Numero visible de la mesa en el salon', example: 5 })
  @IsInt()
  @IsPositive()
  numero: number;
}
