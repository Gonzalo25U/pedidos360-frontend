import { crearClienteApi } from './apiClient';

/** Requiere rol Admin - el backend responde 403 si no lo tienes. */
export async function listarTodasLasFacturas(token) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.get('/api/facturas/admin/todas');
  return data;
}