---
name: documentar-endpoint-swagger
description: Úsalo cada vez que crees o modifiques un endpoint HTTP (Controller, método, DTO) en cualquier Bounded Context, o cuando el usuario pida explícitamente "documenta este endpoint en Swagger", "agrega el controller para X", "expón la operación Y por HTTP". Este skill es obligatorio para CUALQUIER endpoint nuevo, no opcional — CLAUDE.md Sección 6 regla 11 exige que todo endpoint esté documentado en Swagger antes de considerarse completo. Úsalo en conjunto con crear-command-y-handler (primero el Command/Handler, luego este skill para exponerlo).
---

# Crear y documentar un endpoint HTTP con Swagger

Procedimiento para exponer una operación (Command o lectura simple) como endpoint REST, con documentación Swagger completa, respetando que el Controller es un adaptador de entrada delgado (CLAUDE.md Sección 6, regla 3).

## Precondición
Si el endpoint modifica estado, el Command y su Handler correspondiente ya deben existir (usa primero `crear-command-y-handler`). Este skill no crea lógica de negocio, solo la capa HTTP.

## Procedimiento paso a paso

### 1. Crear el DTO de entrada (si el endpoint recibe body)
Ruta: `infrastructure/in/http/dto/<nombre-operacion>.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsOptional, IsIn } from 'class-validator';

export class CrearPedidoDto {
  @ApiProperty({ description: 'ID de la mesa asociada, opcional para domicilios', example: 'a1b2c3d4-...', required: false })
  @IsOptional()
  @IsString()
  mesaId?: string;

  @ApiProperty({ description: 'Tipo de pedido', enum: ['LOCAL', 'DOMICILIO'], example: 'LOCAL' })
  @IsIn(['LOCAL', 'DOMICILIO'])
  tipo: 'LOCAL' | 'DOMICILIO';
}
```

Reglas:
- Todo campo lleva `@ApiProperty()` con `description` y `example` (u opciones `enum` si aplica).
- Validaciones de `class-validator` correspondientes al tipo real del campo (no dejar campos sin validar).
- Nombre del DTO en PascalCase terminando en `Dto`, archivo en kebab-case terminando en `.dto.ts`.

### 2. Crear el DTO de salida (si la respuesta expone datos del dominio)
Ruta: `infrastructure/in/http/dto/<aggregate>-response.dto.ts`

```typescript
export class PedidoResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ enum: ['BORRADOR', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'PAGADO', 'CANCELADO'] })
  estado: string;

  // ...resto de campos que se exponen públicamente
}
```

**Regla dura aplicable (CLAUDE.md Sección 5.6):** el dominio nunca se retorna directo desde el Controller. Siempre se mapea manualmente al DTO de salida (un método privado `mapearADto(pedido: Pedido): PedidoResponseDto` dentro del propio Controller es aceptable y preferido por simplicidad).

### 3. Escribir o extender el Controller
Ruta: `infrastructure/in/http/<aggregate>.controller.ts`

```typescript
import { Controller, Post, Get, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidoController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject('PedidoRepository') private readonly repo: PedidoRepository, // solo para lecturas simples
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo pedido en estado BORRADOR' })
  @ApiResponse({ status: 201, description: 'Pedido creado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crear(@Body() dto: CrearPedidoDto): Promise<PedidoResponseDto> {
    const pedidoId = crypto.randomUUID();
    await this.commandBus.execute(new CrearPedidoCommand(pedidoId, dto.mesaId, dto.tipo));
    const pedido = await this.repo.buscarPorId(pedidoId);
    return this.mapearADto(pedido!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un pedido por su ID' })
  @ApiResponse({ status: 200, type: PedidoResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async obtener(@Param('id') id: string): Promise<PedidoResponseDto> {
    const pedido = await this.repo.buscarPorId(id);
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return this.mapearADto(pedido);
  }

  private mapearADto(pedido: Pedido): PedidoResponseDto {
    // mapeo explícito campo a campo, nunca spread directo del objeto de dominio
  }
}
```

Reglas obligatorias:
- `@ApiTags('<NombreDelContexto>')` a nivel de clase.
- `@ApiOperation({ summary: '...' })` en cada método.
- `@ApiResponse()` para el caso de éxito y para el/los caso(s) de error relevantes (mínimo 400 si el endpoint valida entrada, 404 si busca por ID).
- El Controller **no** contiene `try/catch` para errores de dominio — deja que la `DomainException` se propague hacia el filtro global (`shared/infrastructure/filters/domain-exception.filter.ts`).
- Para operaciones de escritura: el método construye el Command y lo despacha vía `CommandBus.execute(...)`. No invoca el Handler directamente ni contiene lógica de negocio.
- Para lecturas simples: el método llama directo al repositorio inyectado (no se crea una Query de CQRS para esto, según CLAUDE.md Sección 5.5).

### 4. Registrar el Controller en el módulo
Agrega la clase al arreglo `controllers` del `@Module()` correspondiente (no en `providers`).

## Checklist de verificación
- [ ] Todo campo de todo DTO tiene `@ApiProperty()` con `description` y `example`.
- [ ] Todo método del Controller tiene `@ApiOperation()` y al menos dos `@ApiResponse()` (éxito + error relevante).
- [ ] El Controller no tiene lógica de negocio ni `try/catch` de errores de dominio.
- [ ] Las operaciones de escritura pasan por `CommandBus`, no invocan Handlers directamente.
- [ ] El dominio se mapea explícitamente a DTO de salida, nunca se retorna directo.
- [ ] `GET http://localhost:3000/api/docs` muestra el endpoint con su documentación completa (verificar manualmente levantando la app).
