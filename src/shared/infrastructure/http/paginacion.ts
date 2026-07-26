import { ParametrosPaginacion } from '../../application/pagina';

const LIMIT_DEFECTO = 20;
const LIMIT_MAXIMO = 100;

/**
 * Normaliza los query params `page`/`limit` (strings) a valores seguros:
 * page >= 1, 1 <= limit <= 100, con defaults page=1, limit=20.
 */
export function resolverPaginacion(
  page?: string,
  limit?: string,
): ParametrosPaginacion {
  const paginaParseada = parseInt(page ?? '', 10);
  const limitParseado = parseInt(limit ?? '', 10);
  const paginaFinal =
    Number.isFinite(paginaParseada) && paginaParseada > 0 ? paginaParseada : 1;
  const limitFinal =
    Number.isFinite(limitParseado) && limitParseado > 0
      ? Math.min(limitParseado, LIMIT_MAXIMO)
      : LIMIT_DEFECTO;
  return { page: paginaFinal, limit: limitFinal };
}

/** Construye el bloque `meta` de la respuesta a partir del total y la pagina. */
export function construirMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}
