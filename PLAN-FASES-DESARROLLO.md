# Plan de Fases de Desarrollo — Sistema de Restaurante (Backend)

> Este documento complementa `CLAUDE.md` y los skills en `.claude/skills/`. Contiene el orden exacto de construcción, el detalle completo del modelo de datos por Bounded Context, y los criterios de aceptación de cada fase. Ejecuta las fases en orden — no paralelices fases que dependen entre sí.
>
> **Recordatorio de prioridad:** ante cualquier tentación de mejorar, simplificar o reinterpretar algo aquí definido, repórtalo como sugerencia (`### Sugerencia (no aplicada)`) y continúa con lo especificado, tal como indica `CLAUDE.md`.

---

## Fase 0 — Setup del proyecto

### Tareas
1. Crear proyecto con `nest new restaurante-backend`.
2. Instalar dependencias: `@nestjs/cqrs`, `@nestjs/swagger`, `prisma`, `@prisma/client`, `class-validator`, `class-transformer`.
3. Ejecutar `npx prisma init`, configurar `DATABASE_URL` en `.env` (ver Sección "Información de contexto adicional" al final de este documento).
4. Crear `docker-compose.yml` con un servicio `postgres:16` (ver referencia al final de este documento).
5. Crear estructura `src/shared/` completa según `CLAUDE.md` Sección 4: `domain/domain-event.base.ts`, `domain/domain-exception.base.ts`, `infrastructure/prisma/prisma.service.ts`, `infrastructure/filters/domain-exception.filter.ts`.
6. Configurar Swagger en `main.ts`: título "Sistema de Restaurante API", ruta `/api/docs`.
7. Registrar el filtro global de excepciones con `app.useGlobalFilters(...)` en `main.ts`.

### Criterios de aceptación
- [ ] `npm run start:dev` arranca sin errores.
- [ ] `http://localhost:3000/api/docs` carga Swagger UI (vacío o con endpoints base).
- [ ] `docker-compose up -d` levanta Postgres accesible en el puerto configurado.
- [ ] `DomainException` y el filtro global existen y están registrados, aunque todavía no haya ninguna excepción concreta que los use.
- [ ] Ninguna carpeta de `shared/domain/` importa nada de infraestructura.

---

## Fase 1 — Bounded Context Pedidos (Core Domain, completo)

> Usa el skill `crear-bounded-context` para la estructura, `crear-command-y-handler` para cada operación, `documentar-endpoint-swagger` para los endpoints, y `agregar-modelo-prisma-y-migracion` para la persistencia.

### Modelo de datos completo

**Aggregate Root: `Pedido`**

| Atributo | Tipo | Notas |
|---|---|---|
| id | string (UUID) | Identidad |
| mesaId | string (UUID) \| null | Null si es domicilio sin mesa |
| tipo | `'LOCAL' \| 'DOMICILIO'` | Determina si se dispara Domicilios |
| estado | `EstadoPedido` (VO/enum) | Ver estados abajo |
| items | `ItemPedido[]` | Entidades internas |
| createdAt | Date | |

**Estados de `EstadoPedido`:** `BORRADOR`, `CONFIRMADO`, `EN_PREPARACION`, `LISTO`, `PAGADO`, `CANCELADO`.

**Transiciones y reglas (deben vivir como métodos del Aggregate):**
- `agregarItem(item)`: solo si `estado === BORRADOR`. Si no, lanza `PedidoYaConfirmadoException`.
- `confirmar()`: `BORRADOR → CONFIRMADO`. Requiere `items.length > 0`, si no lanza `PedidoVacioException`. Agrega evento `PedidoConfirmado`.
- `iniciarPreparacion()`: `CONFIRMADO → EN_PREPARACION`.
- `marcarListo()`: `EN_PREPARACION → LISTO`. NO emite evento — es la reacción de Pedidos al `PedidoListo` publicado por Cocina (único emisor canónico de ese evento).
- `marcarPagado()`: `LISTO → PAGADO`.
- `cancelar(motivo)`: `CONFIRMADO → CANCELADO`. Agrega evento `PedidoCancelado`.

**Entity interna: `ItemPedido`** — `{ id, productoId, cantidad: number, precioUnitario: Dinero }`.

**Value Object: `Dinero`** — `{ monto: number, moneda: 'COP' }`, inmutable, constructor valida `monto >= 0`, método `sumar(otro: Dinero): Dinero`.

**Value Object: `EstadoPedido`** — enum de TypeScript con los 6 valores listados.

**Domain Events publicados por Pedidos:**
- `PedidoConfirmado { pedidoId, mesaId, tipo, items: {productoId, cantidad}[], total: Dinero, fecha }`
- `PedidoCancelado { pedidoId, motivo, fecha }`

> `PedidoListo` **NO lo publica Pedidos**: su emisor canónico es Cocina (Fase 3). Pedidos reacciona a él en `marcarListo()` sin reemitirlo. El evento se define en `cocina/domain/events/pedido-listo.event.ts`.

**Commands:**
- `CrearPedidoCommand { pedidoId, mesaId?, tipo }`
- `AgregarItemCommand { pedidoId, productoId, cantidad, precioUnitario }`
- `ConfirmarPedidoCommand { pedidoId }`

**Puerto de salida:** `PedidoRepository { buscarPorId(id): Promise<Pedido | null>; guardar(pedido: Pedido): Promise<void>; }`

**Endpoints (`PedidoController`, tag Swagger `Pedidos`):**
- `POST /pedidos` — body `{ mesaId?, tipo }` → crea Pedido en BORRADOR.
- `POST /pedidos/:id/items` — body `{ productoId, cantidad, precioUnitario }` → agrega ítem.
- `POST /pedidos/:id/confirmar` — sin body → confirma el pedido.
- `GET /pedidos/:id` — devuelve el pedido con sus ítems.
- `GET /pedidos` — lista de pedidos, filtro opcional `?estado=`.

### Criterios de aceptación
- [ ] Se puede crear un pedido, agregarle ítems, confirmarlo, y consultarlo reflejando `estado: CONFIRMADO`.
- [ ] Confirmar un pedido sin ítems devuelve HTTP 400 con mensaje relativo a `PedidoVacioException`.
- [ ] Agregar un ítem a un pedido ya confirmado devuelve HTTP 400 (`PedidoYaConfirmadoException`).
- [ ] `domain/model/pedido.aggregate.ts` no importa nada de NestJS ni Prisma.
- [ ] El repositorio Prisma mapea correctamente ida y vuelta (crear → guardar → buscar → reconstituye el mismo estado).
- [ ] Todos los endpoints documentados en Swagger con ejemplos.

---

## Fase 2 — Bounded Context Mesas

### Modelo de datos completo

**Aggregate Root: `Mesa`** — `{ id, numero: NumeroMesa (VO), estado: 'LIBRE' | 'OCUPADA' }`.

**Reglas:**
- `ocupar()`: falla si ya `OCUPADA` → `MesaYaOcupadaException`.
- `liberar()`: falla si ya `LIBRE` → `MesaYaLibreException`.

**Event Handlers (reacciones a otros contextos):**
- `OnPedidoConfirmadoHandler` (escucha `PedidoConfirmado` de Pedidos): si `event.mesaId` no es null, busca la Mesa y llama `ocupar()`.
- `OnPagoRegistradoHandler` (escucha `PagoRegistrado` de Caja, se implementa completo en Fase 6): si el pedido pagado tenía mesa, llama `liberar()`. En esta fase, deja el archivo del handler creado pero puede quedar sin conectar completamente hasta que exista el evento real en Fase 6 — usa el skill `crear-event-handler-cross-context` en ese momento.

**Endpoints (`MesaController`, tag Swagger `Mesas`):**
- `POST /mesas` — body `{ numero }` → crea mesa en `LIBRE`.
- `GET /mesas` — lista todas las mesas con su estado.
- `PATCH /mesas/:id/liberar` — liberación manual.

### Criterios de aceptación
- [ ] Se puede crear una mesa y listarla.
- [ ] Al confirmar un pedido con `mesaId`, la mesa pasa automáticamente a `OCUPADA` (verificable con `GET /mesas`).
- [ ] Intentar ocupar una mesa ya ocupada (indirectamente, confirmando dos pedidos con la misma mesa) resulta en una `DomainException` capturada por el filtro global (documenta cómo se comporta el sistema en este caso, ya que no hay endpoint directo para forzarlo).

---

## Fase 3 — Bounded Context Cocina

### Modelo de datos completo

**Aggregate Root: `OrdenCocina`** (independiente de `Pedido`) — `{ id, pedidoId, items: {productoId, cantidad, preparado: boolean}[], estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTA' }`.

**Reglas:**
- Se crea reaccionando a `PedidoConfirmado`, en `PENDIENTE`, con los ítems del evento (`preparado: false` inicialmente).
- `iniciarPreparacion()`: `PENDIENTE → EN_PREPARACION`.
- `marcarItemPreparado(productoId)`: marca ese ítem.
- `finalizar()`: solo si todos los ítems tienen `preparado: true`, si no lanza `OrdenCocinaIncompletaException`. Cambia a `LISTA`, agrega evento `PedidoListo { pedidoId, fecha }`. **Cocina es el único emisor canónico de `PedidoListo`** (lo consumen Pedidos y Caja). Definir el evento en `cocina/domain/events/pedido-listo.event.ts`.

**Event Handler:** `OnPedidoConfirmadoHandler` en `cocina/` (escucha `PedidoConfirmado` de Pedidos, crea la `OrdenCocina`).

**Endpoints (`OrdenCocinaController`, tag Swagger `Cocina`):**
- `GET /cocina/ordenes` — lista, filtro opcional `?estado=`.
- `PATCH /cocina/ordenes/:id/iniciar`
- `PATCH /cocina/ordenes/:id/items/:productoId/preparar`
- `PATCH /cocina/ordenes/:id/finalizar`

### Criterios de aceptación
- [ ] Al confirmar un pedido, aparece automáticamente una `OrdenCocina` en `GET /cocina/ordenes` con `estado: PENDIENTE`.
- [ ] Se pueden marcar ítems como preparados y finalizar la orden.
- [ ] Finalizar sin todos los ítems preparados devuelve 400.
- [ ] Al finalizar, se emite `PedidoListo` (verificable completamente al terminar la Fase 5, donde `Pedidos` reacciona a este evento).

---

## Fase 4 — Bounded Context Inventario

### Modelo de datos completo

**Aggregate Root: `Producto`** — `{ id, nombre: string, stock: Cantidad (VO), stockReservado: Cantidad (VO) }`.

**Value Object: `Cantidad`** — wrapping de `number`, constructor valida `valor >= 0`, inmutable, métodos `sumar(otra)`, `restar(otra)` (lanza `CantidadInsuficienteException` si el resultado sería negativo).

**Reglas:**
- `reservarStock(cantidad: Cantidad)`: si `stock - stockReservado >= cantidad`, aumenta `stockReservado`. Si no, lanza `StockInsuficienteException`.
- `reponer(cantidad: Cantidad)`: aumenta `stock`.

**Event Handler:** `OnPedidoConfirmadoHandler` en `inventario/`. Lógica exacta:
1. Por cada ítem del evento `PedidoConfirmado`, intenta `producto.reservarStock(cantidad)`.
2. Si **todos** los ítems se reservan con éxito → guarda todos los productos actualizados, emite `StockReservado { pedidoId }`.
3. Si **algún** ítem falla → revierte (deshace) cualquier reserva ya aplicada en esa misma ejecución del handler (no persistir cambios parciales), y emite `ReservaStockFallida { pedidoId, motivo }` en vez de dejar que la excepción se propague sin control.

**Endpoints (`ProductoController`, tag Swagger `Inventario`):**
- `POST /inventario/productos` — body `{ nombre, stockInicial }`.
- `GET /inventario/productos`
- `PATCH /inventario/productos/:id/reponer` — body `{ cantidad }`.

### Criterios de aceptación
- [ ] Crear un producto con stock y confirmar un pedido que lo referencia con cantidad ≤ stock disponible: el `stockReservado` aumenta correctamente (verificable en `GET /inventario/productos`).
- [ ] Confirmar un pedido con cantidad > stock disponible: no queda ningún producto con reserva parcial aplicada, y se emite `ReservaStockFallida` (verificable completamente al terminar la Fase 5).

---

## Fase 5 — Conectar la compensación en Pedidos (patrón Saga simplificado)

### Tareas
1. En `pedidos/`, agregar (si no se hizo en Fase 1) el método `cancelar(motivo: string)` en el Aggregate `Pedido`.
2. Crear `OnReservaStockFallidaHandler` en `pedidos/application/event-handlers/` (escucha `ReservaStockFallida` de Inventario): busca el pedido, llama `cancelar(motivo)`, guarda.
3. Crear `OnStockReservadoHandler` en `pedidos/application/event-handlers/` (escucha `StockReservado` de Inventario): busca el pedido, llama `iniciarPreparacion()`, guarda. (Este es el punto donde se resuelve la decisión documentada en la Sección "Información de contexto adicional" de este documento sobre el orden Cocina/Inventario — ver ahí el detalle.)

### Criterios de aceptación
- [ ] Un pedido cuyo stock no alcanza termina en `estado: CANCELADO` (verificable con `GET /pedidos/:id`) sin intervención manual.
- [ ] Un pedido con stock suficiente avanza correctamente a `EN_PREPARACION` tras la reserva exitosa.

---

## Fase 6 — Bounded Context Caja

### Modelo de datos completo

> **Decisión de modelo (adoptada):** en vez de 1 Factura por Pedido, Caja usa un Aggregate **`Cuenta`** que agrupa los pedidos de una **sesión de mesa** en una sola cuenta. Correlación = ocupación de la mesa (todos los pedidos con ese `mesaId` mientras está OCUPADA). Los pedidos DOMICILIO generan una cuenta propia (una por pedido). Esto cambia el disparador de Caja: reacciona a `PedidoConfirmado` (que ya trae `mesaId`, `tipo` y `total`), no a `PedidoListo` — así no hay que enriquecer `PedidoListo` ni tocar Cocina.

**Aggregate Root: `Cuenta`** — `{ id, mesaId?: string, estado: 'ABIERTA' | 'PAGADA', lineas: LineaCuenta[] }`.

**Entity interna `LineaCuenta`** — `{ pedidoId, total: Dinero (VO) }`. El `total` de la cuenta es la suma de sus líneas. `Dinero` es un VO propio de Caja (cada BC tiene su modelo; el dato llega en el payload de `PedidoConfirmado`).

**Reglas:**
- `agregarPedido(pedidoId, total)`: solo si `ABIERTA` (si no, `CuentaCerradaException`); idempotente (no duplica un pedido ya presente).
- `quitarPedido(pedidoId)`: quita la línea (compensación cuando el pedido se cancela).
- `pagar()`: `ABIERTA → PAGADA`. Falla si ya `PAGADA` → `CuentaYaPagadaException`. Agrega evento `PagoRegistrado { cuentaId, mesaId, pedidoIds, total, fecha }`.

**Event Handlers en `caja/`:**
- `OnPedidoConfirmadoHandler` (escucha `PedidoConfirmado`): busca la `Cuenta` ABIERTA de la mesa (o abre una nueva) y agrega la línea. Para DOMICILIO (`mesaId` null) abre una cuenta propia.
- `OnPedidoCanceladoHandler` (escucha `PedidoCancelado`): quita la línea de ese pedido.

**Endpoints (`CuentaController`, tag Swagger `Caja`):**
- `GET /caja/cuentas`
- `GET /caja/cuentas/:id`
- `POST /caja/cuentas/:id/pagar`

### Tareas adicionales en Pedidos y Mesas
1. En `pedidos/`, crear `OnPedidoListoHandler`: escucha `PedidoListo` (de Cocina), llama `pedido.marcarListo()`.
2. En `pedidos/`, crear `OnPagoRegistradoHandler`: escucha `PagoRegistrado`, marca `PAGADO` cada pedido de la cuenta (best-effort: los que estén en `LISTO`).
3. En `mesas/`, crear `OnPagoRegistradoHandler`: si la cuenta pagada tenía `mesaId`, llama `mesa.liberar()`.

### Criterios de aceptación
- [ ] Al confirmar pedidos de una misma mesa, se acumulan en **una** `Cuenta` ABIERTA (`GET /caja/cuentas`).
- [ ] Un pedido cancelado (sin stock) NO queda en la cuenta.
- [ ] Al pagar la cuenta, la mesa vuelve a `LIBRE` (`GET /mesas`) y los pedidos LISTO pasan a `PAGADO`.
- [ ] Pagar dos veces la misma cuenta devuelve HTTP 400 (`CuentaYaPagadaException`).

---

## Fase 7 — Bounded Context Domicilios

### Modelo de datos completo

**Aggregate Root: `Domicilio`** — `{ id, pedidoId, direccion: Direccion (VO), estado: 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' }`.

**Value Object: `Direccion`** — `{ calle: string, ciudad: string, referencia?: string }`.

**Reglas:**
- Se crea reaccionando a `PedidoConfirmado` **solo si** `event.tipo === 'DOMICILIO'`, en `ASIGNADO`.
- `iniciarEntrega()`: `ASIGNADO → EN_CAMINO`.
- `confirmarEntrega()`: `EN_CAMINO → ENTREGADO`. Agrega evento `DomicilioEntregado`.

> Nota: si `direccion` no viaja en el evento `PedidoConfirmado` actual, agrega el campo `direccion` al DTO/Command de creación de pedido (`CrearPedidoDto`, `CrearPedidoCommand`) y al payload de `PedidoConfirmado`, solo si `tipo === 'DOMICILIO'`. Documenta este ajuste si lo aplicas.

**Event Handler:** `OnPedidoConfirmadoHandler` en `domicilios/`.

**Endpoints (`DomicilioController`, tag Swagger `Domicilios`):**
- `GET /domicilios`
- `PATCH /domicilios/:id/iniciar-entrega`
- `PATCH /domicilios/:id/confirmar-entrega`

### Criterios de aceptación
- [ ] Al confirmar un pedido con `tipo: DOMICILIO`, aparece automáticamente un `Domicilio` en `GET /domicilios` con `estado: ASIGNADO`.
- [ ] Se puede avanzar su estado hasta `ENTREGADO`.
- [ ] Un pedido `tipo: LOCAL` NO genera ningún `Domicilio`.

---

## Fase 8 — Patrón Outbox simplificado

### Tareas
1. Usa el skill `agregar-modelo-prisma-y-migracion` para crear el modelo `OutboxEvent` (ver definición exacta en ese skill).
2. En **al menos** `PedidoRepositoryPrisma` (idealmente en todos los repositorios), modificar el método `guardar()` para que, dentro de la misma transacción Prisma (`prisma.$transaction([...])`), además de persistir el Aggregate, inserte una fila en `OutboxEvent` por cada evento pendiente del Aggregate (payload serializado en JSON).
3. Crear `OutboxDispatcherService` en `src/shared/infrastructure/outbox/outbox-dispatcher.service.ts`: un método que lee `OutboxEvent` con `publicado: false`, los publica en el `EventBus` de `@nestjs/cqrs`, y los marca `publicado: true`. Puede exponerse como un método invocable manualmente en esta fase (no es obligatorio instalar `@nestjs/schedule` salvo que se quiera automatizar con `@Interval()`).

### Criterios de aceptación
- [ ] Existen filas en `outbox_events` después de crear/confirmar un pedido.
- [ ] Tras ejecutar el dispatcher, el campo `publicado` cambia a `true` en las filas correspondientes.
- [ ] El guardado del Aggregate y la inserción en `OutboxEvent` ocurren en la misma transacción (verificable revisando el código del repositorio, no requiere test automatizado).

---

## Fase 9 — Pulido final

### Tareas
1. Revisar que **todos** los endpoints de **todos** los Bounded Contexts tengan `@ApiOperation`, `@ApiResponse` (éxito + error) y que todo DTO tenga `@ApiProperty` completo.
2. Revisar que el filtro global de excepciones traduzca correctamente cada `DomainException` definida en el proyecto a un código HTTP coherente.
3. Escribir `README.md` en la raíz: cómo levantar el proyecto (`docker-compose up -d`, `npx prisma migrate dev`, `npm run start:dev`), arquitectura general (resumen de Bounded Contexts), y la decisión tomada sobre el orden Cocina/Inventario (ver más abajo).

### Criterios de aceptación
- [ ] `http://localhost:3000/api/docs` muestra todos los endpoints de todos los Bounded Contexts, cada uno documentado.
- [ ] `README.md` permite a alguien nuevo levantar el proyecto siguiendo solo sus instrucciones.
- [ ] No queda ningún archivo `*.spec.ts` generado (fuera del scaffold mínimo que NestJS crea por defecto, si no se puede evitar).

---

## Fases de enriquecimiento de dominio (A–D) — "restaurante real"

> Iteración posterior a la Fase 9 para que el modelo refleje un restaurante real: separar **Carta** (platos con precio y receta) de **Inventario** (insumos), quitar el precio del request del cliente, y modelar el ciclo real del stock (reserva → consumo/liberación) con kardex. Respeta 100% los patrones ya establecidos. Orden obligatorio A → B → C → D.

### Fase A — Bounded Context Carta
- Nuevo `src/carta/` con aggregate `Plato { id, nombre, precio: Dinero, categoria, disponible, receta: LineaReceta[] }` y VO/entity `LineaReceta { insumoId, cantidad }`.
- Eventos: `PlatoCreado`, `PrecioActualizado`, `DisponibilidadCambiada`.
- Commands: `CrearPlato`, `ActualizarPrecio`, `CambiarDisponibilidad`, `DefinirReceta`.
- Endpoints: `POST/GET /carta/platos`, `GET /carta/platos/:id`, `PATCH :id/precio`, `PATCH :id/disponibilidad`, `PUT :id/receta`. Aditivo.

### Fase B — Proyección de catálogo en Pedidos
- Read-model `PlatoCatalogo { platoId, nombre, precio, disponible }` mantenido por Pedidos escuchando los eventos de Carta (puerto `CatalogoPlatosRepository`, event-handlers `on-plato-*`). Aún nadie lo consume: `develop` sigue verde.

### Fase C — "Flip" al modelo plato/receta (cambio acoplado)
- `ItemPedido`: `productoId → platoId`, `+observacion?`, `precioUnitario` pasa a ser **snapshot**; `Pedido`: `+observacion?`.
- `AgregarItem`: quita `precioUnitario` del request; el handler toma el precio de la proyección y valida el plato (existe/disponible).
- `PedidoConfirmado`: ítems por `platoId` con observaciones + observación de pedido.
- Carta reacciona a `PedidoConfirmado` → explota recetas → emite `InsumosRequeridos`.
- Inventario reemplaza su reacción a `PedidoConfirmado` por `OnInsumosRequeridosHandler` (reserva por insumos, todo-o-nada).
- Cocina: `ItemOrden.productoId → platoId` + observaciones; preparar por `platoId`.

### Fase D — Movimientos de inventario + ciclo reserva → consumo/liberación
- Entity kardex `MovimientoInventario { tipo: ENTRADA|SALIDA|RESERVA|LIBERACION, cantidad, motivo?, fecha }`, acumulada en el aggregate `Producto` y persistida en la misma transacción.
- `Producto`: `consumirReserva`, `liberarReserva`, `registrarSalida`; `reponer` registra ENTRADA. Puerto/modelo `ReservaInsumo` (reserva por pedido).
- `OnPedidoListoHandler` (consume al LISTO → SALIDA), `OnPedidoCanceladoHandler` (libera al CANCELADO → LIBERACION), `OnInsumosRequeridosHandler` persiste la reserva por pedido.
- Command `RegistrarSalida`; endpoints `POST /inventario/productos/:id/salida` y `GET /inventario/productos/:id/movimientos` (kardex paginado).

### Criterios de aceptación (A–D)
- [ ] La Carta gestiona platos con precio y receta; el cliente **no** envía precio al agregar un ítem (se snapshotea del catálogo).
- [ ] Al confirmar, Inventario reserva **insumos** (explotados de la receta), no platos; `stockReservado` sube y hay movimiento `RESERVA`.
- [ ] Al quedar LISTO, el stock físico baja (movimiento `SALIDA`) y la reserva se limpia; al cancelar, se libera (`LIBERACION`, no-op si no hubo reserva).
- [ ] `GET /inventario/productos/:id/movimientos` devuelve el kardex; `POST .../salida` valida disponible (400 si excede).

> Nota de layout: Inventario queda con más de un aggregate/entity (`Producto` + `MovimientoInventario`) y dos puertos (`ProductoRepository`, `ReservaInsumoRepository`), permitido cuando el dominio lo exige.

---

## Información de contexto adicional

### Variables de entorno (`.env.example`)
```
DATABASE_URL="postgresql://restaurante:restaurante123@localhost:5432/restaurante_db?schema=public"
PORT=3000
```

### `docker-compose.yml` de referencia
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: restaurante
      POSTGRES_PASSWORD: restaurante123
      POSTGRES_DB: restaurante_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

### Puerto y ruta de documentación
- Aplicación: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`

### Decisión sobre el orden Cocina/Inventario
Ambos contextos (`Cocina` e `Inventario`) reaccionan **en paralelo** al mismo evento `PedidoConfirmado` — Cocina no espera a `StockReservado` para crear la `OrdenCocina`. Esta es la decisión adoptada por simplicidad. Como consecuencia:
- Si la reserva de stock falla después de que Cocina ya creó la `OrdenCocina`, la cancelación del pedido (Fase 5) debe considerar también cancelar/descartar la `OrdenCocina` asociada. Agrega esta reacción en la Fase 5 si no está cubierta: `Cocina` debe tener un `OnPedidoCanceladoHandler` que escuche `PedidoCancelado` (emitido por `pedido.cancelar()`) y marque la `OrdenCocina` correspondiente como descartada, o la elimine, según se prefiera — documenta la elección en el `README.md`.

### Convención de moneda
Todos los montos están en pesos colombianos (COP). El campo `monto` puede modelarse como `number` entero o `Decimal` de Prisma, a discreción, siempre que sea consistente en todo el proyecto (no mezclar ambos enfoques entre Bounded Contexts).
