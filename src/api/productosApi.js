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

/** Estas 3 requieren token con rol Admin - el backend las rechaza si no. */
export async function crearProducto(token, producto) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.post('/api/productos', producto);
  return data;
}

export async function actualizarProducto(token, id, producto) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.put(`/api/productos/${id}`, producto);
  return data;
}

export async function eliminarProducto(token, id) {
  const cliente = crearClienteApi(token);
  await cliente.delete(`/api/productos/${id}`);
}
