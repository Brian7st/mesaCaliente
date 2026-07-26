import { ApiProperty } from '@nestjs/swagger';

export class MetaPaginacionDto {
  @ApiProperty({ description: 'Total de registros', example: 42 })
  total: number;

  @ApiProperty({ description: 'Pagina actual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Tamaño de pagina', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Cantidad total de paginas', example: 3 })
  totalPages: number;
}
