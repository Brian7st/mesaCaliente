# CLAUDE.md — Reglas Globales del Proyecto

> Este archivo se carga en cada prompt. Es la fuente de verdad permanente para este proyecto. No tienes memoria de conversaciones previas fuera de este archivo y los archivos de skills en `.claude/skills/`. Todo lo que necesitas saber sobre arquitectura, stack, estructura y convenciones está aquí.

## ⚠️ PRIORIDAD ABSOLUTA — Léase antes de escribir una sola línea de código

**La fidelidad a los patrones definidos en este documento es más importante que cualquier "mejora" o "elegancia" que consideres aplicar por iniciativa propia.**

- Si identificas una posible mejora, optimización, refactor, cambio de librería, cambio de estructura o cualquier desviación de lo aquí definido: **NO la apliques**. Escríbela como una sugerencia explícita al final de tu respuesta, bajo el encabezado `### Sugerencia (no aplicada)`, y continúa implementando exactamente lo que este documento indica.
- Nunca sustituyas una decisión ya tomada aquí (nombre de clase, tecnología, estructura de carpetas, patrón) por tu propio criterio, aunque creas que el tuyo es mejor.
- Si algo no está definido explícitamente ni en este archivo ni en el skill correspondiente, resuelve la ambigüedad priorizando, en este orden: (1) consistencia con decisiones ya tomadas en este documento, (2) los principios de DDD y Arquitectura Hexagonal descritos en la Sección 3, (3) simplicidad — este proyecto no tiene tests automatizados que permitan validar comportamientos complejos, así que la solución más simple y explícita siempre gana sobre la más "inteligente".

---

## 1. Resumen del proyecto

### 1.1 Qué es
Backend de un sistema de gestión para un restaurante, desarrollado como prueba técnica para demostrar dominio de **Domain-Driven Design (DDD)**, **Arquitectura Hexagonal (Puertos y Adaptadores)** y **principios SOLID**, implementado en **NestJS**.

### 1.2 Para qué sirve
Modela el flujo operativo completo de un restaurante: ocupación de mesas, toma de pedidos, preparación en cocina, control de inventario, facturación/cobro en caja, y gestión de pedidos a domicilio.

### 1.3 Alcance — QUÉ SÍ incluye
- Backend completo en NestJS con arquitectura DDD + Hexagonal.
- 6 Bounded Contexts, cada uno como módulo independiente: **Pedidos** (Core Domain), **Mesas**, **Cocina**, **Inventario**, **Caja**, **Domicilios**.
- API REST documentada con Swagger/OpenAPI.
- Comunicación entre Bounded Contexts exclusivamente vía Domain Events (`@nestjs/cqrs`).
- Persistencia con Prisma + PostgreSQL.
- Patrón Saga simplificado (coreografía por eventos, sin orquestador) para compensación Pedidos ↔ Inventario.
- Patrón Outbox simplificado para los Domain Events.
- Manejo de errores centralizado y consistente.

### 1.4 Alcance — QUÉ NO incluye
- **NO** frontend de ningún tipo.
- **NO** autenticación ni autorización (sin login, sin roles, sin JWT), salvo indicación futura explícita.
- **NO** tests unitarios, de integración ni e2e. No generes archivos `*.spec.ts` más allá del scaffold por defecto de NestJS, ni configures cobertura de Jest.
- **NO** Event Sourcing completo (sin reconstrucción de estado desde eventos, sin snapshots, sin proyecciones). Se usa en su lugar un Outbox simplificado (Sección 7.8 del modelo de datos).
- **NO** despliegue a ningún proveedor cloud. Solo debe correr localmente vía Docker Compose.
- **NO** mensajería externa (Kafka, RabbitMQ, SQS). El Pub/Sub de eventos es en memoria, dentro del mismo proceso, vía `EventBus` de `@nestjs/cqrs`.
- **NO** microservicios. Es un **monolito modular**: un solo proceso Node.js, un solo repositorio.

---

## 2. Stack tecnológico (no cambiar sin autorización explícita)

| Componente | Elección | Versión | Por qué |
|---|---|---|---|
| Lenguaje | TypeScript | ^5.4.x | Tipado fuerte, necesario para modelar Value Objects y Aggregates de forma segura. |
| Runtime | Node.js | ^20.x (LTS) | Estable, compatible con NestJS 10 y Prisma 5. |
| Framework backend | NestJS | ^10.x | DI nativa (clave para Puertos/Adaptadores), modularidad first-class, decoradores para Swagger. |
| Mensajería interna / Pub-Sub | `@nestjs/cqrs` | ^10.x | Provee `CommandBus`, `EventBus`, `QueryBus`. Mecanismo elegido para Domain Events y desacoplo entre Bounded Contexts. **No sustituir por `EventEmitter2` ni implementación propia.** |
| ORM / Persistencia | Prisma | ^5.x | Elegido sobre TypeORM por velocidad: schema declarativo único, cliente tipado autogenerado, migraciones con un comando. **Decisión ya tomada y justificada: no cambiar a TypeORM.** |
| Base de datos | PostgreSQL | 16.x (`postgres:16`) | Motor relacional robusto para las relaciones del dominio (Pedido → ItemPedido, etc.). |
| Documentación de API | `@nestjs/swagger` | ^7.x | Requisito explícito del proyecto. |
| Validación de DTOs | `class-validator` + `class-transformer` | compatibles con Nest 10 | Estándar NestJS para validar payloads de entrada. |
| Contenedores | Docker + Docker Compose | — | Levantar PostgreSQL de forma reproducible. |
| Gestor de paquetes | npm | — | Usar `package-lock.json`, no mezclar con yarn/pnpm. |

**Regla dura:** ningún paquete de infraestructura (`@nestjs/typeorm`, `@prisma/client`, `express`, `@nestjs/swagger`, etc.) puede importarse dentro de ninguna carpeta `domain/`.

---

## 3. Arquitectura

### 3.1 Principio general
El proyecto sigue **DDD** (táctico y estratégico) combinado con **Arquitectura Hexagonal (Puertos y Adaptadores)**, aplicando **SOLID** transversalmente.

- **DDD** define **qué se construye** dentro de cada Bounded Context: Entities, Value Objects, Aggregates, Domain Services, Domain Events, Repositories (como concepto).
- **Hexagonal** define **cómo se organiza y aísla** ese código: el dominio no depende de ningún detalle técnico; toda comunicación con el exterior pasa por interfaces (puertos) implementadas por clases concretas (adaptadores).

### 3.2 Estilo de sistema
**Monolito modular.** Un único proceso NestJS. Cada Bounded Context es un módulo de NestJS (`@Module()`) autocontenido, con su propia estructura interna `domain/application/infrastructure` — cada Bounded Context es, en sí mismo, un mini-hexágono.

### 3.3 Bounded Contexts del sistema

| Bounded Context | Carpeta raíz | Tipo de subdominio | Responsabilidad |
|---|---|---|---|
| Pedidos | `src/pedidos/` | **Core Domain** | Crear/confirmar pedidos, gestionar ítems, orquestar el ciclo de vida del pedido. |
| Mesas | `src/mesas/` | Supporting | Estado de ocupación de las mesas. |
| Cocina | `src/cocina/` | Supporting | Preparación de los ítems de un pedido confirmado. |
| Inventario | `src/inventario/` | Supporting | Stock de productos/insumos, reserva y descuento. |
| Caja | `src/caja/` | Supporting | Facturación y registro de pagos. |
| Domicilios | `src/domicilios/` | Supporting | Asignación y rastreo de entregas a domicilio. |

`Pedidos` recibe el mayor cuidado de diseño por ser el Core Domain. Los demás son Supporting Subdomains: correctos y completos, sin sobre-ingeniería.

### 3.4 Regla de comunicación entre Bounded Contexts
**Regla dura:** ningún Bounded Context puede importar o invocar directamente una clase (servicio, repositorio, aggregate) de otro Bounded Context. La única comunicación permitida entre Bounded Contexts es vía **Domain Events publicados en el `EventBus`**. Dentro de un mismo Bounded Context sí se permite invocación directa.

### 3.5 Flujo de negocio de referencia

```
1. Se ocupa una Mesa (o el pedido es directamente a domicilio, sin mesa).
2. Se crea un Pedido en BORRADOR, asociado o no a una Mesa.
3. Se agregan ItemPedido (producto + cantidad).
4. Se confirma el Pedido → evento PedidoConfirmado.
5. Inventario escucha PedidoConfirmado → reserva stock de cada ítem.
   5a. Todo con stock suficiente → StockReservado.
   5b. Algún ítem sin stock → revierte lo ya reservado en esa operación →
       ReservaStockFallida → Pedidos cancela el pedido (compensación Saga).
6. Cocina escucha PedidoConfirmado → crea OrdenCocina con los ítems.
7. Cocina finaliza la preparación → PedidoListo (único emisor de este evento).
8. Pedidos escucha PedidoListo → actualiza su estado (no lo reemite).
9. Caja escucha PedidoConfirmado → agrega el pedido a la Cuenta de la mesa
   (o abre una nueva); si el pedido se cancela, lo quita (PedidoCancelado).
10. Se paga la Cuenta → PagoRegistrado.
11. Si el Pedido es DOMICILIO → Domicilios escucha PedidoConfirmado y crea
    un Domicilio (ASIGNADO → EN_CAMINO → ENTREGADO).
12. Si el Pedido tenía Mesa y ya se pagó → la Mesa se libera.
```

### 3.6 Diagrama de eventos entre contextos

```
Pedidos --PedidoConfirmado--> Inventario --StockReservado/ReservaStockFallida--> Pedidos
Pedidos --PedidoConfirmado--> Cocina --PedidoListo--> Pedidos
Pedidos --PedidoConfirmado--> Caja (agrega a la Cuenta de la mesa)
Pedidos --PedidoCancelado---> Caja (quita el pedido de la Cuenta)
Caja    --PagoRegistrado----> Pedidos (marcar PAGADO) y Mesas (liberar)
Pedidos --PedidoConfirmado--> Domicilios
Pedidos --PedidoConfirmado--> Mesas (ocupar, si aplica)
```

### 3.7 Composition Root
En NestJS, el Composition Root está **distribuido en el arreglo `providers` de cada `@Module()`**, enlazando el **token del puerto** con el **adaptador concreto**:

```typescript
providers: [
  {
    provide: 'PedidoRepository',       // token del puerto (string literal)
    useClass: PedidoRepositoryPrisma,  // adaptador concreto
  },
],
```

`app.module.ts` es el composition root **global**: importa todos los módulos de Bounded Context y la configuración de conexión a base de datos.

---

## 4. Estructura de carpetas y archivos (layout exacto, replicar sin excepción)

```
restaurante-backend/
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── nest-cli.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── shared/
│   │   ├── domain/
│   │   │   ├── domain-event.base.ts
│   │   │   └── domain-exception.base.ts
│   │   ├── infrastructure/
│   │   │   ├── prisma/
│   │   │   │   └── prisma.service.ts
│   │   │   ├── outbox/
│   │   │   │   └── outbox-dispatcher.service.ts
│   │   │   └── filters/
│   │   │       └── domain-exception.filter.ts
│   │   └── application/
│   │
│   ├── pedidos/                       ← Bounded Context (Core Domain), patrón de referencia
│   │   ├── pedidos.module.ts
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   │   ├── pedido.aggregate.ts
│   │   │   │   ├── item-pedido.entity.ts
│   │   │   │   ├── estado-pedido.vo.ts
│   │   │   │   └── dinero.vo.ts
│   │   │   ├── events/
│   │   │   │   ├── pedido-confirmado.event.ts
│   │   │   │   └── pedido-cancelado.event.ts
│   │   │   ├── exceptions/
│   │   │   │   ├── pedido.exceptions.ts
│   │   │   │   └── dinero.exceptions.ts
│   │   │   └── ports/
│   │   │       └── out/
│   │   │           └── pedido.repository.ts
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── crear-pedido/
│   │   │   │   │   ├── crear-pedido.command.ts
│   │   │   │   │   └── crear-pedido.handler.ts
│   │   │   │   ├── agregar-item/
│   │   │   │   │   ├── agregar-item.command.ts
│   │   │   │   │   └── agregar-item.handler.ts
│   │   │   │   └── confirmar-pedido/
│   │   │   │       ├── confirmar-pedido.command.ts
│   │   │   │       └── confirmar-pedido.handler.ts
│   │   │   └── event-handlers/
│   │   │       ├── on-stock-reservado.handler.ts
│   │   │       ├── on-reserva-stock-fallida.handler.ts
│   │   │       ├── on-pedido-listo.handler.ts
│   │   │       └── on-pago-registrado.handler.ts
│   │   └── infrastructure/
│   │       ├── in/
│   │       │   └── http/
│   │       │       ├── pedido.controller.ts
│   │       │       └── dto/
│   │       │           ├── crear-pedido.dto.ts
│   │       │           ├── agregar-item.dto.ts
│   │       │           └── pedido-response.dto.ts
│   │       └── out/
│   │           └── persistence/
│   │               └── pedido.repository.prisma.ts
│   │
│   ├── mesas/                         ← misma subestructura que pedidos/, adaptada a Mesa
│   ├── cocina/                        ← misma subestructura, adaptada a OrdenCocina
│   ├── inventario/                    ← misma subestructura, adaptada a Producto
│   ├── caja/                          ← misma subestructura, adaptada a Factura
│   └── domicilios/                    ← misma subestructura, adaptada a Domicilio
```

**Regla dura:** todos los Bounded Contexts deben replicar exactamente la subestructura mostrada para `pedidos/`. No omitir carpetas ni aplanar la estructura "para ir más rápido". Para el procedimiento exacto de creación de un nuevo Bounded Context, usa el skill `crear-bounded-context`.

---

## 5. Patrones y convenciones de código (aplican SIEMPRE)

### 5.1 Nomenclatura de archivos
- **kebab-case** con sufijo descriptivo: `pedido.aggregate.ts`, `dinero.vo.ts`, `pedido-confirmado.event.ts`, `crear-pedido.command.ts`, `crear-pedido.handler.ts`, `pedido.controller.ts`, `pedido.repository.ts` (puerto), `pedido.repository.prisma.ts` (adaptador).
- Excepciones de dominio: `<elemento>.exceptions.ts` agrupadas en `domain/exceptions/` (una por aggregate o VO que lanza excepciones, ej. `pedido.exceptions.ts`, `dinero.exceptions.ts`).
- Clases en **PascalCase**: `Pedido`, `ItemPedido`, `Dinero`, `PedidoConfirmado`, `CrearPedidoHandler`, `PedidoController`.
- Interfaces de puertos sin prefijo `I` (no `IPedidoRepository`, sí `PedidoRepository`).
- Tokens de DI: string literal igual al nombre de la interfaz, ej. `'PedidoRepository'`, usado consistentemente en `providers` y en `@Inject('PedidoRepository')`.
- Eventos de dominio: siempre en pasado (`PedidoConfirmado`, `PagoRegistrado`, `DomicilioEntregado`), nunca en imperativo.
- Commands (CQRS): siempre en presente/imperativo (`CrearPedidoCommand`, `ConfirmarPedidoCommand`).

**Motivo:** un vocabulario y formato consistente hace que cualquier desarrollador (o el propio agente en una sesión futura) pueda predecir dónde vive cada cosa sin tener que explorar el código.

### 5.2 Idioma
Todo el código de dominio (clases, métodos, propiedades, eventos) va en **español**, siguiendo el Lenguaje Ubicuo de este proyecto (Pedido, Mesa, Cocina, Factura, etc.). Los términos propios de NestJS/TypeScript (`Controller`, `Module`, `Injectable`) se mantienen en inglés por ser parte de la API del framework.

**Motivo:** el Lenguaje Ubicuo de DDD debe reflejarse literalmente en el código; traducir términos de negocio a inglés rompe la trazabilidad entre el modelo de negocio y el código.

### 5.3 Manejo de errores
- El dominio lanza excepciones propias heredando de `DomainException` (`shared/domain/domain-exception.base.ts`). Ejemplos: `PedidoVacioException`, `PedidoYaConfirmadoException`, `StockInsuficienteException`, `MesaYaOcupadaException`, `FacturaYaPagadaException`.
- Un filtro global (`shared/infrastructure/filters/domain-exception.filter.ts`, registrado con `app.useGlobalFilters(...)` en `main.ts`) traduce `DomainException` a HTTP: 400 para violaciones de reglas de negocio, 404 para "no encontrado", 500 solo para errores no controlados.
- Los Controllers **nunca** usan `try/catch` para ocultar errores de dominio; deben dejarlos propagar hacia el filtro global.

**Motivo:** centraliza la traducción error-de-negocio → código HTTP en un solo lugar, evitando que cada Controller reinvente su propio manejo de errores.

### 5.4 Inyección de dependencias / puertos
- Cada puerto de salida (`domain/ports/out/*.ts`) es una `interface`.
- Cada adaptador de salida (`infrastructure/out/persistence/*.prisma.ts`) es una `class` que hace `implements` de esa interfaz.
- El enlace puerto→adaptador se declara en el `@Module()` con `{ provide: 'Token', useClass: Adaptador }` (Sección 3.7).
- Los Handlers inyectan el puerto con `@Inject('Token')`, tipado con la interfaz, nunca con la clase concreta.

**Motivo:** es el mecanismo concreto de Inversión de Dependencias (la "D" de SOLID); permite cambiar de tecnología de persistencia sin tocar dominio ni aplicación.

### 5.5 CQRS (`@nestjs/cqrs`)
- Toda operación que **modifica** estado es un **Command** (`XxxCommand`) manejado por un **Handler** (`implements ICommandHandler<XxxCommand>`).
- Toda reacción a algo ocurrido en otro Bounded Context es un **Event Handler** (`OnXxxHandler`, decorado con `@EventsHandler(XxxEvent)`).
- Los Aggregates acumulan sus eventos internamente (`obtenerEventos()`) y el Command Handler los publica en el `EventBus` **después** de persistir, nunca antes.
- No se usan Queries de CQRS en este proyecto salvo indicación explícita de una fase; las lecturas simples se resuelven directo en el Controller llamando al repositorio.
- El **puerto de entrada** de cada operación de escritura se materializa en el par **Command + Handler**. Este proyecto NO define interfaces `ports/in` (`*.use-case.ts`) separadas: con CQRS serían código muerto que nadie implementa.
- Cada Domain Event tiene un **único emisor canónico**: el Aggregate cuya transición de estado representa ese hecho de negocio. Ningún otro Bounded Context reemite ese evento — los demás reaccionan a él (ej. `PedidoListo` lo emite solo Cocina; Pedidos y Caja lo consumen).

**Motivo:** separa explícitamente comandos (cambian estado) de eventos (notifican lo que ya pasó), y evita publicar un evento sobre un cambio que después falla al persistir.

### 5.6 DTOs y Swagger
- Cada Controller usa DTOs de entrada (con `class-validator`) y de salida, en `infrastructure/in/http/dto/`.
- Todo DTO lleva `@ApiProperty()` con `description` y `example`.
- Todo método de Controller lleva `@ApiOperation()` y `@ApiResponse()` para al menos 200/201 y 400.
- El dominio **nunca** se expone directamente como respuesta HTTP: siempre se mapea a un DTO de salida.

**Motivo:** documentación de API es requisito explícito del proyecto; y el mapeo dominio→DTO evita filtrar detalles internos del modelo de dominio al contrato público.

Para el procedimiento exacto de creación de un endpoint, usa el skill `documentar-endpoint-swagger`.

### 5.7 SOLID — aplicación concreta esperada
- **S:** cada Handler hace una sola cosa. Cada Aggregate solo contiene lógica de su propio dominio.
- **O:** nuevos Bounded Contexts / Event Handlers se agregan sin modificar el Aggregate que publica el evento original.
- **L:** cualquier adaptador que implemente un puerto debe ser sustituible por otro sin romper al consumidor.
- **I:** los puertos son específicos por necesidad, sin métodos que un consumidor no usa.
- **D:** los Handlers dependen de interfaces, nunca de clases concretas de infraestructura.

---

## 6. Reglas duras / restricciones no negociables

1. Ningún archivo en `domain/` importa `@prisma/client`, `@nestjs/swagger`, `express`, ni decoradores de infraestructura de NestJS. Las clases de dominio deben ser POTS (Plain Old TypeScript Objects) sin decoradores.
2. Ningún Bounded Context importa directamente una clase de otro Bounded Context. Única excepción: las clases `*.event.ts` pueden importarse para suscribirse (`@EventsHandler(...)`).
3. Los Controllers no contienen lógica de negocio: solo validan el DTO, despachan un Command o hacen una lectura simple, y mapean el resultado a DTO de salida.
4. Los Command/Event Handlers no contienen reglas de negocio complejas: orquestan (buscar Aggregate, invocar su método, guardar, publicar eventos resultantes).
5. Toda regla de negocio (invariante) vive dentro del Aggregate correspondiente, nunca en un Handler, Controller, ni adaptador de persistencia.
6. No se implementan tests de ningún tipo en este proyecto.
7. No se implementa autenticación/autorización salvo indicación futura explícita.
8. No se implementa Event Sourcing completo — usar el Outbox simplificado (ver modelo de datos, Sección 7.8, en el skill `agregar-modelo-prisma-y-migracion` y en el plan de fases).
9. Toda comunicación entre Bounded Contexts es asíncrona vía eventos, nunca llamadas HTTP internas ni invocación directa de servicios de otro módulo.
10. Prisma es el único ORM permitido. Nada de TypeORM, Sequelize, ni SQL crudo fuera de los adaptadores de persistencia.
11. Todo endpoint HTTP debe estar documentado en Swagger antes de considerarse una tarea completa.
12. Los nombres de carpetas, archivos, clases y eventos deben respetar exactamente lo indicado en las Secciones 4 y 5 — no usar sinónimos ni traducciones alternativas (no `Order` en vez de `Pedido`, no `Kitchen` en vez de `Cocina`).
13. **Ante cualquier duda sobre si algo "mejora" la arquitectura definida aquí: no lo apliques. Repórtalo como sugerencia y continúa con lo definido.**

---

## 7. Modelo de datos e información de negocio (resumen — detalle completo en cada skill relevante)

### 7.1 Pedido (Aggregate Root, Core Domain — `src/pedidos/`)
- Atributos: `id`, `mesaId?`, `tipo: 'LOCAL' | 'DOMICILIO'`, `estado: EstadoPedido`, `items: ItemPedido[]`, `createdAt`.
- Estados: `BORRADOR → CONFIRMADO → EN_PREPARACION → LISTO → PAGADO`, o `CONFIRMADO → CANCELADO`.
- Entity interna: `ItemPedido { id, productoId, cantidad, precioUnitario: Dinero }`.
- VO `Dinero { monto, moneda: 'COP' }`, inmutable, `monto >= 0`.
- Reglas: no se agregan ítems fuera de `BORRADOR`; no se confirma sin ítems.
- Eventos publicados: `PedidoConfirmado`, `PedidoCancelado`. (`PedidoListo` NO lo publica Pedidos: su emisor canónico es Cocina; Pedidos reacciona a él en `marcarListo()`, sin reemitirlo.)
- El pedido transporta una `direccion` de entrega opcional (`{ calle, ciudad, referencia? }`), obligatoria cuando `tipo === 'DOMICILIO'`. Viaja en el payload de `PedidoConfirmado` para que Domicilios pueda crear la entrega. Pedidos no valida ni modela la dirección (el VO `Direccion` con validación vive en Domicilios); solo la lleva.

### 7.2 Mesa (Aggregate Root — `src/mesas/`)
- Atributos: `id`, `numero`, `estado: 'LIBRE' | 'OCUPADA'`.
- Reglas: no ocupar una mesa ya ocupada; no liberar una ya libre.
- Reacciona a `PedidoConfirmado` (ocupar) y `PagoRegistrado` (liberar).

### 7.3 OrdenCocina (Aggregate Root — `src/cocina/`, independiente de Pedido)
- Atributos: `id`, `pedidoId`, `items: {productoId, cantidad, preparado}[]`, `estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTA'`.
- Se crea reaccionando a `PedidoConfirmado`. Al finalizar (todos los ítems preparados), emite `PedidoListo` (Cocina es el **único emisor canónico** de este evento; lo consumen Pedidos y Caja).

### 7.4 Producto (Aggregate Root — `src/inventario/`)
- Atributos: `id`, `nombre`, `stock: Cantidad`, `stockReservado: Cantidad`.
- VO `Cantidad`, `valor >= 0`.
- Reacciona a `PedidoConfirmado`: reserva stock de todos los ítems o revierte lo parcial y emite `ReservaStockFallida`.

### 7.5 Cuenta (Aggregate Root — `src/caja/`)
- Atributos: `id`, `mesaId?` (null para domicilios), `estado: 'ABIERTA' | 'PAGADA'`, `lineas: LineaCuenta[]`.
- Entity interna `LineaCuenta { pedidoId, total: Dinero }`. El `total` de la cuenta es la suma de sus líneas.
- Agrupa los pedidos de una **sesión de mesa** (correlación = ocupación de la mesa) en una sola cuenta; los pedidos DOMICILIO generan una cuenta propia (una por pedido).
- Reacciona a `PedidoConfirmado` (agrega la línea a la cuenta ABIERTA de la mesa, o abre una nueva) y a `PedidoCancelado` (quita la línea — compensación del Saga).
- `pagar()` emite `PagoRegistrado { cuentaId, mesaId, pedidoIds, total }`. Falla si ya está `PAGADA` (`CuentaYaPagadaException`).
- **Decisión de negocio** (elegida sobre el modelo 1 Factura por Pedido del plan original): una cuenta por sesión de mesa. Ver `PLAN-FASES-DESARROLLO.md` Fase 6.

### 7.6 Domicilio (Aggregate Root — `src/domicilios/`)
- Atributos: `id`, `pedidoId`, `direccion: Direccion`, `estado: 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO'`.
- VO `Direccion { calle, ciudad, referencia? }`.
- Se crea reaccionando a `PedidoConfirmado` **solo si** `tipo === 'DOMICILIO'`.

> El detalle completo de atributos, transiciones, endpoints y payloads de eventos de cada Bounded Context está en el **Plan de Fases de Desarrollo** (`PLAN-FASES-DESARROLLO.md`) y se referencia también desde los skills correspondientes. Este archivo (`CLAUDE.md`) contiene el resumen necesario para cualquier tarea; consulta el plan de fases para el detalle exacto de campos y validaciones al implementar cada Bounded Context.

---

## 8. Skills disponibles — cuándo usarlos

Este proyecto tiene skills en `.claude/skills/` para procedimientos recurrentes. Actívalos cuando la tarea lo amerite, no los ignores asumiendo que ya sabes el procedimiento:

- **`crear-bounded-context`** → al iniciar un nuevo Bounded Context desde cero (Mesas, Cocina, Inventario, Caja, Domicilios).
- **`crear-command-y-handler`** → al agregar una nueva operación que modifica estado dentro de un Bounded Context existente.
- **`crear-event-handler-cross-context`** → al hacer que un Bounded Context reaccione a un evento publicado por otro.
- **`agregar-modelo-prisma-y-migracion`** → al necesitar un nuevo modelo de persistencia o cambiar el schema.
- **`documentar-endpoint-swagger`** → al crear o modificar cualquier endpoint HTTP.

---

**Recordatorio final:** este documento y sus skills son la única fuente de verdad. Si en algún momento el código existente en el repositorio contradice este documento, señala la inconsistencia explícitamente antes de decidir cuál de los dos prevalece — no asumas silenciosamente que el código tiene razón.
