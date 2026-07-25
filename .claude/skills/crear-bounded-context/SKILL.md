---
name: crear-bounded-context
description: Úsalo cuando necesites crear desde cero un nuevo Bounded Context/módulo de NestJS para este proyecto (por ejemplo Mesas, Cocina, Inventario, Caja, Domicilios), o cuando el usuario pida "crea el módulo de X", "implementa el Bounded Context de X", "arma el contexto de X siguiendo el mismo patrón que Pedidos". NO usar para agregar un endpoint suelto a un contexto ya existente (usa crear-command-y-handler) ni para reaccionar a un evento de otro contexto en un módulo ya creado (usa crear-event-handler-cross-context).
---

# Crear un nuevo Bounded Context

Este skill define el procedimiento exacto para crear un Bounded Context completo, replicando el mismo patrón hexagonal usado en `src/pedidos/` (Sección 3–4 de `CLAUDE.md`). No te desvíes de este orden ni omitas carpetas.

## Precondición
Antes de ejecutar este skill, confirma en `CLAUDE.md` Sección 7 y en `PLAN-FASES-DESARROLLO.md` cuál es el Aggregate Root, sus atributos, estados, reglas de negocio y eventos del Bounded Context que vas a crear. No inventes atributos ni reglas que no estén documentadas ahí; si falta información, repórtalo antes de continuar.

## Procedimiento paso a paso

### 1. Crear la estructura de carpetas
Replica exactamente este layout, reemplazando `<contexto>` por el nombre en minúsculas del Bounded Context (`mesas`, `cocina`, `inventario`, `caja`, `domicilios`) y `<Aggregate>` por el nombre del Aggregate Root en PascalCase:

```
src/<contexto>/
├── <contexto>.module.ts
├── domain/
│   ├── model/
│   │   └── <aggregate>.aggregate.ts
│   ├── events/
│   │   └── (un archivo .event.ts por cada evento que este contexto PUBLICA como emisor canónico)
│   ├── exceptions/
│   │   └── (un <elemento>.exceptions.ts por aggregate/VO que lanza excepciones)
│   └── ports/
│       └── out/
│           └── <aggregate>.repository.ts
├── application/
│   ├── commands/
│   │   └── <nombre-comando>/
│   │       ├── <nombre-comando>.command.ts
│   │       └── <nombre-comando>.handler.ts
│   └── event-handlers/
│       └── (un on-<evento-externo>.handler.ts por cada evento de OTRO contexto que este escucha)
└── infrastructure/
    ├── in/
    │   └── http/
    │       ├── <aggregate>.controller.ts
    │       └── dto/
    └── out/
        └── persistence/
            └── <aggregate>.repository.prisma.ts
```

Si el Aggregate tiene Entities internas o Value Objects propios, agrégalos en `domain/model/` como `<nombre>.entity.ts` o `<nombre>.vo.ts`, siguiendo la nomenclatura de CLAUDE.md Sección 5.1.

### 2. Modelar el dominio puro (sin ningún import de NestJS/Prisma)
1. Escribe el Aggregate Root en `domain/model/<aggregate>.aggregate.ts`: propiedades privadas, métodos que expresan las reglas de negocio documentadas (no getters/setters genéricos — métodos con nombre de negocio, ej. `confirmar()`, `ocupar()`, `registrarPago()`).
2. Si el Aggregate acumula eventos, agrega un array privado de eventos y un método `obtenerEventos()`.
3. Cada regla de negocio que pueda violarse debe lanzar una excepción propia que extienda `DomainException` (definida en `src/shared/domain/domain-exception.base.ts`). Nombra la excepción en PascalCase terminando en `Exception` y ubícala en `domain/exceptions/<elemento>.exceptions.ts` (un archivo por aggregate o VO, ej. `pedido.exceptions.ts`, `dinero.exceptions.ts`).
4. Escribe los Value Objects/Entities internas necesarias, inmutables donde CLAUDE.md lo indique.
5. Escribe cada Domain Event que este contexto publica, como una `class` simple con propiedades `readonly` (sin decoradores), en `domain/events/`. Cada evento tiene un **único emisor canónico**: el Aggregate cuya transición de estado representa ese hecho de negocio. Ningún otro contexto reemite ese evento — los demás reaccionan a él (ver `crear-event-handler-cross-context`).

**Verificación antes de continuar:** ningún archivo dentro de `domain/` debe tener un `import` que no sea de otro archivo dentro de `domain/` o de tipos nativos de TypeScript.

### 3. Definir los puertos
1. `domain/ports/out/<aggregate>.repository.ts`: interfaz con, como mínimo, `buscarPorId(id: string): Promise<Aggregate | null>` y `guardar(aggregate: Aggregate): Promise<void>`. Agrega métodos adicionales solo si el modelo de datos del contexto los requiere explícitamente.
2. **Puertos de entrada:** este proyecto NO define interfaces `ports/in` (`*.use-case.ts`) separadas. El puerto de entrada de cada operación de escritura se materializa en el par Command + Handler (CQRS). No crees archivos `*.use-case.ts` vacíos: serían código muerto.

### 4. Implementar la capa de aplicación (CQRS)
Para cada operación de escritura:
1. Crea `application/commands/<nombre-comando>/<nombre-comando>.command.ts`: una `class` con las propiedades del comando (imperativo, presente, ver CLAUDE.md 5.1).
2. Crea `application/commands/<nombre-comando>/<nombre-comando>.handler.ts`: `@CommandHandler(<Comando>) class <Comando>Handler implements ICommandHandler<<Comando>>`. Dentro:
   - Inyecta el repositorio con `@Inject('<Aggregate>Repository')`.
   - Inyecta `EventBus` de `@nestjs/cqrs` si el comando termina publicando eventos.
   - El método `execute()` SOLO orquesta: busca el Aggregate (si aplica), invoca el método de negocio del Aggregate, guarda, publica los eventos resultantes con `eventBus.publish(...)`. No debe contener condicionales de reglas de negocio — esas viven en el Aggregate.

Si el contexto debe reaccionar a eventos de otros Bounded Contexts, usa el skill `crear-event-handler-cross-context` para esa parte específica.

### 5. Modelar la persistencia
1. Agrega el modelo correspondiente en `prisma/schema.prisma` (usa el skill `agregar-modelo-prisma-y-migracion` para el detalle de este paso, incluida la migración).
2. Implementa `infrastructure/out/persistence/<aggregate>.repository.prisma.ts`: `class <Aggregate>RepositoryPrisma implements <Aggregate>Repository`. Inyecta `PrismaService` (`src/shared/infrastructure/prisma/prisma.service.ts`). Implementa el mapeo manual entre las filas de Prisma y el objeto de dominio — nunca devuelvas directamente un tipo generado por Prisma desde un método del repositorio.

### 6. Implementar el adaptador HTTP
Usa el skill `documentar-endpoint-swagger` para este paso — cubre DTOs, decoradores de Swagger y la forma exacta del Controller.

### 7. Registrar el módulo (Composition Root local)
En `<contexto>.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule],
  controllers: [/* Controller(s) */],
  providers: [
    /* ...CommandHandlers, ...EventHandlers */,
    { provide: '<Aggregate>Repository', useClass: <Aggregate>RepositoryPrisma },
  ],
})
export class <Contexto>Module {}
```

Luego importa `<Contexto>Module` en `src/app.module.ts`.

### 8. Verificación final (checklist de salida del skill)
Antes de dar por completado el Bounded Context, confirma:
- [ ] Ningún archivo en `domain/` importa infraestructura.
- [ ] El Aggregate Root no tiene setters públicos genéricos; solo métodos de negocio.
- [ ] Cada regla de negocio documentada en CLAUDE.md/plan de fases está implementada y lanza su excepción correspondiente si se viola.
- [ ] El repositorio Prisma implementa exactamente la interfaz del puerto, sin métodos extra no usados.
- [ ] El módulo está importado en `app.module.ts`.
- [ ] Todos los endpoints tienen documentación Swagger completa (ver skill `documentar-endpoint-swagger`).
- [ ] Si detectaste una posible mejora al patrón durante este proceso, la reportaste como sugerencia sin aplicarla (ver CLAUDE.md, sección de prioridad absoluta).
