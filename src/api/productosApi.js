import { crearClienteApi } from './apiClient';

/** Catalogo publico: no requiere token. */
export async function listarProductosPublico() {
  const cliente = crearClienteApi();
  const { data } = await cliente.get('/publico/productos');
  return data;
}

export async function obtenerProductoPublico(id) {
  const cliente = crearClienteApi();
  const { data } = await cliente.get(`/publico/productos/${id}`);
  return data;
}
