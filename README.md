# Restaurant Backend — DDD + Hexagonal + CQRS

Backend for a restaurant management system, built with **NestJS** to demonstrate **Domain-Driven Design (DDD)**, **Hexagonal Architecture (Ports & Adapters)** and **SOLID**. It models the full operational flow of a restaurant: menu and recipes, table occupancy, order taking, kitchen preparation, inventory (with stock movements and reservation lifecycle), billing/checkout, and home delivery.

It is a **modular monolith**: a single Node.js process where each Bounded Context is a self-contained NestJS module. Contexts communicate **only through Domain Events** (`@nestjs/cqrs` `EventBus`) — never by direct calls.

> Architecture and conventions live in [`CLAUDE.md`](./CLAUDE.md). The build order, data model and per-phase acceptance criteria live in [`PLAN-FASES-DESARROLLO.md`](./PLAN-FASES-DESARROLLO.md).

## Stack

| Concern | Choice |
|---|---|
| Language / Runtime | TypeScript 5 · Node.js 20 |
| Framework | NestJS 10 |
| Messaging / CQRS | `@nestjs/cqrs` (`CommandBus`, `EventBus`) |
| ORM / DB | Prisma 5 · PostgreSQL 16 |
| API docs | `@nestjs/swagger` (OpenAPI) |
| Validation | `class-validator` / `class-transformer` |
| Containers | Docker Compose (PostgreSQL) |

## Getting started

Requirements: Node.js 20+, Docker.

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment
cp .env.example .env

# 4. Apply database migrations
npx prisma migrate dev

# 5. Run in watch mode
npm run start:dev
```

- API: `http://localhost:3000`
- **Swagger UI: `http://localhost:3000/api/docs`**
- OpenAPI JSON: `http://localhost:3000/api/docs-json`

## Bounded Contexts

| Context | Root | Type | Responsibility |
|---|---|---|---|
| **Pedidos** | `Pedido` | Core Domain | Order lifecycle and its items |
| Carta | `Plato` | Supporting | Menu: dishes with their own price and recipe |
| Mesas | `Mesa` | Supporting | Table occupancy |
| Cocina | `OrdenCocina` | Supporting | Preparation of confirmed orders |
| Inventario | `Producto` | Supporting | Ingredient stock, movements (kardex) and reservation |
| Caja | `Cuenta` | Supporting | Billing and payments |
| Domicilios | `Domicilio` | Supporting | Home deliveries |

> The ubiquitous language is Spanish (Pedido, Plato, Mesa, Cocina, Cuenta…): the business language is reflected literally in the code.

> **Plato vs Producto.** A `Plato` (Carta) is what the customer buys — it has a sale price and a recipe. A `Producto` (Inventario) is an *ingredient* consumed by recipes and tracked as stock. An order references dishes (`platoId`); Carta explodes each dish's recipe into the ingredients Inventario must reserve.

Each context is its own hexagon:

```
src/<context>/
├── domain/          # pure business model (no NestJS/Prisma imports)
│   ├── model/       # aggregate, entities, value objects
│   ├── events/      # domain events it publishes
│   ├── exceptions/  # domain exceptions (extend DomainException)
│   └── ports/out/   # repository interface (port)
├── application/     # CQRS command handlers + cross-context event handlers
└── infrastructure/  # in/http (controller + DTOs) · out/persistence (Prisma adapter)
```

## Architecture in practice

- **Hexagonal / DIP** — the domain depends on nothing technical. Handlers depend on a port interface (`@Inject('PedidoRepository')`); the Prisma adapter is bound in each module's `providers`. No file under any `domain/` imports `@nestjs` or `@prisma`.
- **CQRS** — every state change is a `Command` + `Handler`. Handlers only orchestrate (load aggregate → invoke business method → persist → let events flow). All invariants live inside the aggregate.
- **Domain Events** — the only channel between contexts. A context reacts by importing *only* the event class from the publisher; the publisher is never modified.
- **Single canonical emitter** — each event has exactly one owner. `PedidoListo` is emitted only by `Cocina`; Pedidos reacts to it without re-emitting.
- **Choreographed Saga** — no central orchestrator. On `PedidoConfirmado`, Carta explodes the dishes' recipes and emits `InsumosRequeridos`; Inventario reserves the ingredients; on failure it emits `ReservaStockFallida` and Pedidos compensates by cancelling the order.
- **Catalog projection** — Pedidos keeps a local read-model of Carta (`PlatoCatalogo`), fed by `PlatoCreado`/`PrecioActualizado`/`DisponibilidadCambiada`. When an item is added, the price is **snapshotted** from that projection into the order line — the client never sends a price.
- **Reservation lifecycle** — reserved ingredients are **consumed** when the order becomes `LISTO` (stock drops, `SALIDA` movement) and **released** if the order is cancelled (`LIBERACION`). Every stock change is recorded in an append-only kardex (`MovimientoInventario`).
- **Outbox** — domain events are written to an `OutboxEvent` table inside the same transaction as the aggregate, and a dispatcher publishes them to the `EventBus` **sequentially, one cycle at a time**. This gives deterministic event ordering over the in-memory bus. Consequence: event propagation is **eventual** (sub-second dispatcher latency), not synchronous.
- **Centralized errors** — domain exceptions extend `DomainException`; a global filter maps them to HTTP (`NO_ENCONTRADO` → 404, business-rule violations → 400). Controllers never `try/catch` domain errors.

### Event flow

```
Pedidos --PedidoConfirmado--> Carta      --InsumosRequeridos--> Inventario --StockReservado/ReservaStockFallida--> Pedidos
Pedidos --PedidoConfirmado--> Cocina     --PedidoListo--> Pedidos (LISTO) + Inventario (consume reserva → SALIDA)
Pedidos --PedidoConfirmado--> Caja        (adds a line to the table's Cuenta)
Pedidos --PedidoCancelado---> Caja        (removes the line)
Pedidos --PedidoCancelado---> Cocina      (discards the OrdenCocina)
Pedidos --PedidoCancelado---> Inventario  (release reserva → LIBERACION)
Pedidos --PedidoConfirmado--> Mesas       (occupies the table, if any)
Pedidos --PedidoConfirmado--> Domicilios  (only if tipo = DOMICILIO)
Caja    --PagoRegistrado----> Pedidos (mark PAGADO) and Mesas (free the table)
Carta   --PlatoCreado/PrecioActualizado/DisponibilidadCambiada--> Pedidos (catalog projection)
```

### End-to-end lifecycle

```
Pedido:     BORRADOR → CONFIRMADO → EN_PREPARACION → LISTO → PAGADO   (or → CANCELADO)
Mesa:       OCUPADA (on confirm) ───────────────────────────→ LIBRE (on payment)
Cuenta:     ABIERTA (on confirm) ───────────────────────────→ PAGADA (on payment)
Ingredient: reservado (on confirm) → consumido/SALIDA (on LISTO)  or  liberado/LIBERACION (on cancel)
```

## API overview

| Context | Endpoints |
|---|---|
| Pedidos | `POST /pedidos` · `POST /pedidos/:id/items` · `POST /pedidos/:id/confirmar` · `GET /pedidos/:id` · `GET /pedidos?estado=` |
| Carta | `POST /carta/platos` · `GET /carta/platos` · `GET /carta/platos/:id` · `PATCH /carta/platos/:id/precio` · `PATCH /carta/platos/:id/disponibilidad` · `PUT /carta/platos/:id/receta` |
| Mesas | `POST /mesas` · `GET /mesas` · `PATCH /mesas/:id/liberar` |
| Cocina | `GET /cocina/ordenes?estado=` · `PATCH /cocina/ordenes/:id/iniciar` · `PATCH /cocina/ordenes/:id/items/:platoId/preparar` · `PATCH /cocina/ordenes/:id/finalizar` |
| Inventario | `POST /inventario/productos` · `GET /inventario/productos` · `GET /inventario/productos/:id` · `PATCH /inventario/productos/:id/reponer` · `POST /inventario/productos/:id/salida` · `GET /inventario/productos/:id/movimientos` |
| Caja | `GET /caja/cuentas` · `GET /caja/cuentas/:id` · `POST /caja/cuentas/:id/pagar` |
| Domicilios | `GET /domicilios` · `PATCH /domicilios/:id/iniciar-entrega` · `PATCH /domicilios/:id/confirmar-entrega` |

An order item is added by `platoId` (with an optional `observacion` for the kitchen); the price is taken from the catalog projection, **not** sent by the client. A LOCAL order needs a `mesaId`; a DOMICILIO order needs a `direccion` (`{ calle, ciudad, referencia? }`), validated at creation. Kitchen orders and ingredient reservations appear automatically after an order is confirmed (via the Outbox dispatcher — allow ~1 second). List endpoints are offset-paginated (`?page=&limit=`) and return `{ data, meta: { total, page, limit, totalPages } }`.

## Key design decisions

- **One Cuenta per table session (not one Factura per order).** All confirmed orders of a table accumulate into a single open `Cuenta` while the table is occupied; paying it settles everything at once and frees the table. Correlation is the table occupation, since there is no user/auth concept. DOMICILIO orders (no table) get their own account. Caja reacts to `PedidoConfirmado`/`PedidoCancelado` (which already carry `mesaId` and `total`), so `Cocina` is never touched for billing.
- **Cocina and Inventario react to `PedidoConfirmado` in parallel** (Cocina does not wait for stock). If the stock reservation later fails, `Pedidos` cancels the order and `Cocina` reacts to `PedidoCancelado` by moving the `OrdenCocina` to `DESCARTADA`. The Outbox's sequential dispatch guarantees the order already exists when the cancellation is processed.
- **Money is stored as integer COP** across every context (`Dinero.monto: number` ↔ `Int`), consistently — no mixed `Decimal`.
- **The delivery address travels on the order.** `PedidoConfirmado` carries the address so Domicilios can build its own validated `Direccion` value object; Pedidos only transports the data.

## Scope

Included: the 7 Bounded Contexts, REST API with Swagger, event-driven integration, catalog projection with price snapshot, ingredient reservation lifecycle with kardex, simplified Saga and Outbox, centralized error handling, offset pagination.

Not included (by design): frontend, authentication/authorization, automated tests, full Event Sourcing, external messaging (Kafka/RabbitMQ), cloud deployment, microservices.
