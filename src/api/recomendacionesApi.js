import { crearClienteApi } from './apiClient';

/**
 * Recomendaciones personalizadas (analytics-ms, via API Gateway).
 * Requiere token: el usuario sale del JWT, no se envia como parametro.
 */
export async function listarRecomendaciones(token, limite = 4) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.get('/api/recomendaciones', { params: { limite } });
  return data;
}