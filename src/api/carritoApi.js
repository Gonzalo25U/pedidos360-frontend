import { crearClienteApi } from './apiClient';

export async function listarCarrito(token) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.get('/api/carrito');
  return data;
}

export async function agregarAlCarrito(token, item) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.post('/api/carrito', item);
  return data;
}

export async function eliminarDelCarrito(token, itemId) {
  const cliente = crearClienteApi(token);
  await cliente.delete(`/api/carrito/${itemId}`);
}
