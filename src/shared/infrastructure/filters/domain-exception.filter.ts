import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../domain/domain-exception.base';

/**
 * Traduce cualquier DomainException que se propague desde el dominio a una
 * respuesta HTTP coherente:
 *  - 'NO_ENCONTRADO'  -> 404
 *  - 'REGLA_NEGOCIO'  -> 400
 * Los errores no controlados (que no sean DomainException) no llegan aca; los
 * maneja el filtro por defecto de NestJS como 500.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception.tipo === 'NO_ENCONTRADO'
        ? HttpStatus.NOT_FOUND
        : HttpStatus.BAD_REQUEST;

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
