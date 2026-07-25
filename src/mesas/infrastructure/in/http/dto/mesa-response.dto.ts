import { ApiProperty } from '@nestjs/swagger';

export class MesaResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 5 })
  numero: number;

  @ApiProperty({ enum: ['LIBRE', 'OCUPADA'], example: 'LIBRE' })
  estado: string;
}
