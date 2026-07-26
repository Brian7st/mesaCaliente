import { ApiProperty } from '@nestjs/swagger';
import { MetaPaginacionDto } from '../../../../../shared/infrastructure/http/meta-paginacion.dto';

export class LineaRecetaResponseDto {
  @ApiProperty({ example: 'insumo-carne' })
  insumoId: string;

  @ApiProperty({ example: 2 })
  cantidad: number;
}

export class PlatoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Hamburguesa clasica' })
  nombre: string;

  @ApiProperty({ description: 'Precio de venta en COP', example: 25000 })
  precio: number;

  @ApiProperty({
    enum: ['ENTRADA', 'PRINCIPAL', 'POSTRE', 'BEBIDA', 'ACOMPANAMIENTO'],
    example: 'PRINCIPAL',
  })
  categoria: string;

  @ApiProperty({ example: true })
  disponible: boolean;

  @ApiProperty({ type: [LineaRecetaResponseDto] })
  receta: LineaRecetaResponseDto[];
}

export class PlatosPaginadosDto {
  @ApiProperty({ type: [PlatoResponseDto] })
  data: PlatoResponseDto[];

  @ApiProperty({ type: MetaPaginacionDto })
  meta: MetaPaginacionDto;
}
