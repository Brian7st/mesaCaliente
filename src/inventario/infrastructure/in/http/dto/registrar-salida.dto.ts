import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class RegistrarSalidaDto {
  @ApiProperty({ description: 'Unidades a dar de baja del stock', example: 3 })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({
    description: 'Motivo de la salida (merma, ajuste, etc.)',
    example: 'Merma por vencimiento',
    required: false,
  })
  @IsOptional()
  @IsString()
  motivo?: string;
}
