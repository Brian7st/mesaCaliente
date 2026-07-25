---
name: crear-command-y-handler
description: Úsalo cuando necesites agregar una nueva operación que MODIFICA estado dentro de un Bounded Context que ya existe (por ejemplo "agrega la acción de cancelar un pedido", "necesito un endpoint para reponer stock", "agrega la posibilidad de marcar un ítem como preparado"). Se activa con frases como "crea el comando para X", "agrega una nueva acción/operación a Y", "necesito poder hacer X sobre el aggregate Y". NO usar para crear un Bounded Context completo desde cero (usa crear-bounded-context) ni para reacciones a eventos de otro contexto (usa crear-event-handler-cross-context) ni para operaciones de solo lectura (esas van directo en el Controller sin Command, según CLAUDE.md Sección 5.5).
---

# Crear un Command y su Handler (CQRS)

Procedimiento para agregar una nueva operación de escritura a un Bounded Context ya existente, siguiendo el patrón CQRS definido en `CLAUDE.md` Sección 5.5.

## Precondición
Confirma que la operación que vas a agregar:
1. Modifica el estado de un Aggregate existente (si es una lectura, NO uses este skill — resuélvelo directo en el Controller).
2. Está descrita, o es una extensión lógica directa, de las reglas de negocio documentadas en `CLAUDE.md` Sección 7 y en `PLAN-FASES-DESARROLLO.md`. Si la operación implica una regla de negocio nueva no documentada, repórtalo antes de inventarla.

## Procedimiento paso a paso

### 1. Verificar o agregar el método de negocio en el Aggregate
Antes de escribir el Command, revisa si el Aggregate Root ya tiene un método que exprese esta operación (ej. `pedido.cancelar(motivo)`). Si no existe:
- Agrégalo en `domain/model/<aggregate>.aggregate.ts`.
- El método debe validar sus propias precondiciones y lanzar una `DomainException` específica si se violan (nomenclatura: `<Motivo>Exception`, extendiendo `DomainException`).
- Si la operación debe emitir un Domain Event, el método debe agregarlo al array interno de eventos del Aggregate (no publicarlo directamente — eso lo hace el Handler después de persistir).

### 2. Crear el Command
Ruta: `application/commands/<nombre-comando>/<nombre-comando>.command.ts`

```typescript
export class <Nombre>Command {
  constructor(
    readonly <parametro1>: <tipo>,
    // ...resto de parámetros necesarios para identificar y ejecutar la operación
  ) {}
}
```

Nomenclatura: imperativo/presente, PascalCase terminando en `Command` (ej. `CancelarPedidoCommand`, `ReponerStockCommand`). Ver CLAUDE.md Sección 5.1.

### 3. Crear el Handler
Ruta: `application/commands/<nombre-comando>/<nombre-comando>.handler.ts`

```typescript
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

@CommandHandler(<Nombre>Command)
export class <Nombre>Handler implements ICommandHandler<<Nombre>Command> {
  constructor(
    @Inject('<Aggregate>Repository') private readonly repo: <Aggregate>Repository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: <Nombre>Command): Promise<void> {
    const aggregate = await this.repo.buscarPorId(command.<idParam>);
    if (!aggregate) throw new NotFoundException('<Aggregate> no encontrado');

    aggregate.<metodoDeNegocio>(/* parámetros del command */);
    await this.repo.guardar(aggregate);

    aggregate.obtenerEventos().forEach(evento => this.eventBus.publish(evento));
  }
}
```

**Regla dura aplicable aquí (CLAUDE.md Sección 6, punto 4):** este Handler NO debe contener ningún `if` que evalúe una regla de negocio (ej. "si el estado es X entonces..."). Esa lógica vive exclusivamente en el método del Aggregate invocado. El Handler solo: busca, invoca, guarda, publica.

### 4. Registrar el Handler en el módulo
Agrega la clase del Handler al arreglo `providers` del `@Module()` correspondiente (`<contexto>.module.ts`). No se registra en `controllers` ni en un arreglo separado — vive junto a los demás providers.

### 5. Exponer el Command vía HTTP (si aplica)
Si esta operación debe ser invocable desde afuera, usa el skill `documentar-endpoint-swagger` para crear el endpoint del Controller que construye y despacha este Command a través de `CommandBus`.

## Checklist de verificación
- [ ] La regla de negocio vive en el Aggregate, no en el Handler.
- [ ] El Command es una clase simple sin lógica, solo datos.
- [ ] El Handler publica los eventos DESPUÉS de `guardar()`, nunca antes.
- [ ] El Handler está registrado en `providers` del módulo.
- [ ] Si la operación requería una excepción de dominio nueva, se creó extendiendo `DomainException` y con nombre descriptivo.
