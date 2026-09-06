import { crearClienteApi } from './apiClient';

export async function crearPedido(token, items) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.post('/api/pedidos', { items });
  return data;
}

export async function listarMisPedidos(token) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.get('/api/pedidos');
  return data;
}
