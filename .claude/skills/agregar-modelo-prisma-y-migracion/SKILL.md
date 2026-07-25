---
name: agregar-modelo-prisma-y-migracion
description: Úsalo cuando necesites agregar o modificar un modelo de persistencia en prisma/schema.prisma y generar/ejecutar la migración correspondiente (por ejemplo "crea la tabla de Pedido", "necesito persistir OrdenCocina", "agrega el campo X al modelo Y", "implementa la tabla de outbox_events"). Se activa con frases como "modela X en la base de datos", "agrega la migración para Y", "necesito guardar Z en Prisma". NO usar para escribir el Aggregate de dominio (ese es TypeScript puro sin Prisma, ver crear-bounded-context) ni para el código del repositorio que traduce entre Prisma y dominio (ese paso va después de este skill, dentro de crear-bounded-context paso 5).
---

# Agregar un modelo a Prisma y ejecutar la migración

Procedimiento para modelar la persistencia de un Aggregate Root (o del Outbox) en `prisma/schema.prisma`, respetando que el dominio nunca conoce este esquema directamente.

## Precondición
Confirma en `CLAUDE.md` Sección 7 y `PLAN-FASES-DESARROLLO.md` cuáles son los atributos exactos del Aggregate que vas a persistir. El modelo de Prisma debe poder representar esos atributos, pero **no tiene que ser una copia 1:1** de las clases de dominio — es normal que el modelo de persistencia sea más "plano" (ej. Value Objects como `Dinero { monto, moneda }` pueden representarse como columnas sueltas `total Decimal`, `moneda String`, o como un campo `Json` si es más simple, a discreción, siempre que el mapeo en el repositorio pueda reconstruir el objeto de dominio exacto).

## Procedimiento paso a paso

### 1. Editar `prisma/schema.prisma`
Agrega el modelo siguiendo esta convención:
- Nombre del modelo en PascalCase singular, igual al Aggregate Root (ej. `model Pedido`, `model OrdenCocina`).
- `id` como `String @id @default(uuid())`.
- Relaciones internas del Aggregate (ej. `ItemPedido` dentro de `Pedido`) se modelan como modelos Prisma separados con relación `1:N`, pero recuerda: esa separación es solo de persistencia, en el dominio `ItemPedido` sigue viviendo como Entity interna del Aggregate `Pedido`, nunca se expone como su propio Aggregate.
- Usa tipos apropiados: `String`, `Int`, `Decimal` (para dinero), `DateTime`, `Boolean`. Para enums de estado (`EstadoPedido`, etc.), usa `enum` de Prisma con los mismos valores exactos definidos en el Value Object de dominio correspondiente.

Ejemplo de referencia (Pedido):

```prisma
enum EstadoPedidoDb {
  BORRADOR
  CONFIRMADO
  EN_PREPARACION
  LISTO
  PAGADO
  CANCELADO
}

model Pedido {
  id        String          @id @default(uuid())
  mesaId    String?
  tipo      String
  estado    EstadoPedidoDb
  createdAt DateTime        @default(now())
  items     ItemPedido[]
}

model ItemPedido {
  id             String  @id @default(uuid())
  pedidoId       String
  pedido         Pedido  @relation(fields: [pedidoId], references: [id])
  productoId     String
  cantidad       Int
  precioUnitario Decimal
}
```

### 2. Modelo de Outbox (si aún no existe en el proyecto)
Si es la primera vez que se toca el patrón Outbox (ver CLAUDE.md Sección 1.3 y `PLAN-FASES-DESARROLLO.md` Fase de Outbox), agrega también, una sola vez en todo el proyecto:

```prisma
model OutboxEvent {
  id          String   @id @default(uuid())
  aggregateId String
  eventType   String
  payload     Json
  createdAt   DateTime @default(now())
  publicado   Boolean  @default(false)
}
```

No dupliques este modelo si ya existe — verifica primero con `view` sobre `prisma/schema.prisma`.

### 3. Generar y ejecutar la migración
Ejecuta, en este orden, desde la raíz del proyecto:

```bash
npx prisma format
npx prisma migrate dev --name <nombre-descriptivo-en-kebab-case>
```

El nombre de la migración debe describir el cambio, ej. `crear-modelo-pedido`, `agregar-outbox-events`, `agregar-campo-referencia-direccion`.

### 4. Regenerar el cliente de Prisma (normalmente automático con `migrate dev`, verificar igual)
```bash
npx prisma generate
```

### 5. Verificación
- [ ] El schema compila sin errores (`npx prisma format` no falla).
- [ ] La migración se ejecutó contra la base de datos de Docker Compose (`docker-compose up -d` debe estar corriendo antes de este paso).
- [ ] Los nombres de campos en el modelo Prisma son consistentes con lo que el repositorio (`<aggregate>.repository.prisma.ts`) va a necesitar mapear — revisa esto ANTES de escribir el repositorio para no tener que rehacer la migración.
- [ ] Si agregaste un enum de Prisma, sus valores coinciden exactamente (mismos strings) con el enum del Value Object de dominio correspondiente.
- [ ] No se filtró ningún tipo generado por Prisma (`PrismaClient`, tipos `Pedido` autogenerados, etc.) hacia `domain/` — esos tipos solo se usan dentro de `infrastructure/out/persistence/`.

## Nota sobre transacciones para el patrón Outbox
Cuando el repositorio de un Aggregate deba escribir también en `OutboxEvent` (ver `PLAN-FASES-DESARROLLO.md`), ambas escrituras (el Aggregate y el evento de outbox) deben ir dentro de la misma transacción de Prisma usando `prisma.$transaction([...])`. Este skill solo cubre el modelado del schema; la implementación de esa transacción va en el repositorio, siguiendo `crear-bounded-context` paso 5.
