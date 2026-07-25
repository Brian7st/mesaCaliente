import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CrearPedidoDto {
  @ApiProperty({
    description: 'ID de la mesa asociada, opcional para domicilios',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  mesaId?: string;

  @ApiProperty({
    description: 'Tipo de pedido',
    enum: ['LOCAL', 'DOMICILIO'],
    example: 'LOCAL',
  })
  @IsIn(['LOCAL', 'DOMICILIO'])
  tipo: 'LOCAL' | 'DOMICILIO';
}
