/**
 * Parametros de paginacion por offset que reciben los puertos de listado.
 */
export type ParametrosPaginacion = {
  page: number;
  limit: number;
};

/**
 * Resultado paginado que devuelven los puertos de listado. `items` son objetos
 * de dominio; el mapeo a DTO se hace en el Controller.
 */
export type Pagina<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
