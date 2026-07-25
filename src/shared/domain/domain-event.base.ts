/**
 * Base para todos los Domain Events del sistema.
 * Los eventos concretos de cada Bounded Context extienden esta clase
 * (o simplemente declaran sus propiedades readonly) y se publican en el
 * EventBus de @nestjs/cqrs. No debe importar nada de infraestructura.
 */
export abstract class DomainEvent {
  readonly ocurridoEn: Date;

  constructor() {
    this.ocurridoEn = new Date();
  }
}
