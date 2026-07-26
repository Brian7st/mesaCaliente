import { Prisma } from '@prisma/client';

/**
 * Convierte un Domain Event en una fila de OutboxEvent. El payload se serializa
 * a JSON puro (las fechas quedan como string ISO). El eventType es el nombre de
 * la clase del evento, usado luego para reconstruirlo en el dispatcher.
 */
export function aFilaOutbox(evento: object): Prisma.OutboxEventCreateManyInput {
  const datos = evento as Record<string, unknown>;
  const aggregateId =
    (datos.pedidoId as string) ?? (datos.id as string) ?? 'desconocido';
  return {
    aggregateId,
    eventType: evento.constructor.name,
    payload: JSON.parse(JSON.stringify(datos)) as Prisma.InputJsonValue,
  };
}
