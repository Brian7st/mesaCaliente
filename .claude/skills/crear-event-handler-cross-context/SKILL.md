---
name: crear-event-handler-cross-context
description: Úsalo cuando un Bounded Context necesita reaccionar a un evento de dominio publicado por OTRO Bounded Context (por ejemplo "cuando se confirme un pedido, Cocina debe crear una orden", "Mesas debe ocuparse cuando se confirma un pedido con mesa", "Caja debe generar factura cuando el pedido esté listo"). Se activa con frases como "haz que X reaccione a Y", "conecta el evento X con el contexto Y", "cuando pase X en un contexto, debe pasar Y en otro". NO usar para comunicación dentro del MISMO Bounded Context (eso es invocación directa normal) ni para crear el Command que primero emite el evento (usa crear-command-y-handler para eso).
---

# Crear un Event Handler entre Bounded Contexts

Procedimiento para que un Bounded Context reaccione a un Domain Event publicado por otro, respetando la regla dura de comunicación de `CLAUDE.md` Sección 3.4: **la única forma de comunicación entre Bounded Contexts es vía eventos**, nunca invocación directa de clases de otro módulo.

## Precondición
1. Verifica que el evento que vas a escuchar ya existe en `domain/events/` del Bounded Context que lo publica. Si no existe, primero créalo ahí (no lo definas duplicado en el contexto que escucha).
2. Verifica en `CLAUDE.md` Sección 3.5–3.6 (flujo de negocio y diagrama de eventos) que esta reacción está efectivamente prevista. Si no lo está, repórtalo como algo a confirmar antes de implementarlo.

## Procedimiento paso a paso

### 1. Importar el evento (única importación permitida entre contextos)
En el Bounded Context que va a reaccionar, importa la clase del evento directamente desde el contexto que lo publica:

```typescript
import { PedidoConfirmado } from '../../pedidos/domain/events/pedido-confirmado.event';
```

Esta es la **única excepción** a la regla de no importar entre Bounded Contexts (CLAUDE.md Sección 6, punto 2). No importes nada más de ese contexto (ni su Aggregate, ni su Repository, ni sus Handlers).

### 2. Crear el Event Handler
Ruta: `application/event-handlers/on-<nombre-evento-en-kebab-case>.handler.ts`

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';

@EventsHandler(PedidoConfirmado)
export class OnPedidoConfirmadoHandler implements IEventHandler<PedidoConfirmado> {
  constructor(
    @Inject('<Aggregate>Repository') private readonly repo: <Aggregate>Repository,
  ) {}

  async handle(event: PedidoConfirmado): Promise<void> {
    // 1. (Opcional) aplicar una condición de filtrado simple del propio evento,
    //    ej. `if (event.tipo !== 'DOMICILIO') return;` — esto NO es una regla de
    //    negocio del Aggregate ajeno, es solo decidir si este contexto participa.
    // 2. Construir o buscar el Aggregate propio de este contexto.
    const nuevoAggregate = <Aggregate>.crearDesde(event.<campo1>, event.<campo2>);
    // 3. Guardar.
    await this.repo.guardar(nuevoAggregate);
    // 4. Si este Aggregate a su vez genera eventos propios al crearse,
    //    publicarlos con EventBus igual que en un Command Handler.
  }
}
```

Nomenclatura obligatoria: `On<NombreDelEvento>Handler`, archivo `on-<nombre-evento-kebab>.handler.ts`.

### 3. Registrar el Handler en el módulo receptor
Agrega la clase al arreglo `providers` del `@Module()` del contexto que **reacciona** (no del que publica). Asegúrate de que ese módulo tenga `CqrsModule` en sus `imports`.

### 4. Verificar que el contexto emisor no necesita saber nada de esto
El Bounded Context que publica el evento (ej. `pedidos/`) no debe modificarse para que esta reacción funcione — ni imports nuevos, ni referencias al contexto receptor. Si te encuentras necesitando modificar el emisor para que el receptor funcione, la comunicación está mal diseñada; detente y repórtalo en vez de acoplar los contextos directamente.

## Caso especial: reacción con posible fallo y compensación (patrón Saga simplificado)
Si el Event Handler puede fallar una regla de negocio (ej. Inventario reaccionando a `PedidoConfirmado` sin stock suficiente), sigue el patrón de coreografía documentado en el modelo de datos (`PLAN-FASES-DESARROLLO.md`, patrón Saga):
1. El Handler intenta la operación.
2. Si falla, revierte cualquier cambio parcial que ya haya hecho dentro de esa misma ejecución del handler (no dejar estado a medias).
3. Publica un evento de fallo (ej. `ReservaStockFallida`) en vez de lanzar una excepción no controlada — el contexto original (`Pedidos`) debe tener su propio Event Handler escuchando ese evento de fallo para aplicar la compensación de su lado (ej. `pedido.cancelar()`).

No implementes un orquestador central de Sagas ni ninguna librería adicional para esto — es coreografía pura por eventos, tal como está definido en CLAUDE.md.

## Checklist de verificación
- [ ] Solo se importó la clase del evento del otro contexto, nada más.
- [ ] El Handler vive en `application/event-handlers/` del contexto que reacciona.
- [ ] El Handler está registrado en `providers` del módulo receptor, y ese módulo importa `CqrsModule`.
- [ ] El contexto emisor no fue modificado.
- [ ] Si la reacción puede fallar, se implementó la compensación por evento de fallo, sin excepciones no controladas cruzando el `EventBus`.
