import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxService } from './outbox.service';
import { OutboxDispatcherService } from './outbox-dispatcher.service';

/**
 * Modulo global del patron Outbox. Expone OutboxService para registrar eventos
 * y corre el dispatcher que los publica en el EventBus de forma secuencial.
 */
@Global()
@Module({
  imports: [CqrsModule],
  providers: [OutboxService, OutboxDispatcherService],
  exports: [OutboxService],
})
export class OutboxModule {}
