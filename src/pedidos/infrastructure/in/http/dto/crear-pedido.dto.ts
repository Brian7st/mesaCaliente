import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class DireccionDto {
  @ApiProperty({ description: 'Calle y numero', example: 'Cra 7 # 45-12' })
  @IsString()
  @IsNotEmpty()
  calle: string;

  @ApiProperty({ description: 'Ciudad', example: 'Bogota' })
  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @ApiProperty({ description: 'Referencia opcional', example: 'Apto 302', required: false })
  @IsOptional()
  @IsString()
  referencia?: string;
}

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

  @ApiProperty({
    description: 'Direccion de entrega (obligatoria si tipo es DOMICILIO)',
    type: DireccionDto,
    required: false,
  })
  @ValidateIf((dto: CrearPedidoDto) => dto.tipo === 'DOMICILIO')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DireccionDto)
  direccion?: DireccionDto;

  @ApiProperty({
    description: 'Observacion general del pedido (ej. mesa apurada)',
    example: 'Todo junto por favor',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacion?: string;
}
