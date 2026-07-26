import { PedidoConfirmado } from '../../../pedidos/domain/events/pedido-confirmado.event';
import { PedidoCancelado } from '../../../pedidos/domain/events/pedido-cancelado.event';
import { PedidoListo } from '../../../cocina/domain/events/pedido-listo.event';
import { StockReservado } from '../../../inventario/domain/events/stock-reservado.event';
import { ReservaStockFallida } from '../../../inventario/domain/events/reserva-stock-fallida.event';
import { PagoRegistrado } from '../../../caja/domain/events/pago-registrado.event';
import { DomicilioEntregado } from '../../../domicilios/domain/events/domicilio-entregado.event';

/**
 * Registro de tipos de evento -> clase, para reconstruir la instancia correcta
 * al despachar desde el Outbox (el @EventsHandler se resuelve por la clase).
 * Cada nuevo Domain Event que viaje por el Outbox debe registrarse aca.
 */
const CLASES: Array<new (...args: never[]) => object> = [
  PedidoConfirmado,
  PedidoCancelado,
  PedidoListo,
  StockReservado,
  ReservaStockFallida,
  PagoRegistrado,
  DomicilioEntregado,
];

const REGISTRO = new Map<string, (new (...args: never[]) => object)>(
  CLASES.map((clase) => [clase.name, clase]),
);

/**
 * Reconstruye una instancia del evento a partir del tipo y el payload. Crea el
 * objeto con el prototipo de la clase para que `event.constructor` coincida y el
 * EventBus enrute al handler correcto.
 */
export function reconstruirEvento(
  eventType: string,
  payload: unknown,
): object | null {
  const clase = REGISTRO.get(eventType);
  if (!clase) {
    return null;
  }
  return Object.assign(Object.create(clase.prototype), payload);
}
