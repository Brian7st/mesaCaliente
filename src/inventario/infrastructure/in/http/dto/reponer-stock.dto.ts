import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class ReponerStockDto {
  @ApiProperty({ description: 'Unidades a reponer al stock', example: 50 })
  @IsInt()
  @IsPositive()
  cantidad: number;
}
