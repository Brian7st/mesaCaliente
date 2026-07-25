import { DomainException } from '../../../shared/domain/domain-exception.base';
import { EstadoPedido } from './estado-pedido.vo';

export class PedidoVacioException extends DomainException {
  constructor(pedidoId: string) {
    super(`El pedido ${pedidoId} no puede confirmarse sin items.`);
  }
}

export class PedidoYaConfirmadoException extends DomainException {
  constructor(pedidoId: string) {
    super(
      `No se pueden agregar items: el pedido ${pedidoId} ya no esta en BORRADOR.`,
    );
  }
}

export class TransicionInvalidaException extends DomainException {
  constructor(desde: EstadoPedido, hacia: EstadoPedido) {
    super(`Transicion invalida de estado: ${desde} -> ${hacia}.`);
  }
}
