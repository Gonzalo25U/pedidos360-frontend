import { crearClienteApi } from './apiClient';


export async function iniciarPago(token) {
  const cliente = crearClienteApi(token);
  const { data } = await cliente.post('/api/pagos/iniciar');
  return data;
}

/** Webpay exige un POST con token_ws: se hace con un formulario oculto. */
export function redirigirAWebpay(url, tokenWs) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token_ws';
  input.value = tokenWs;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
}

/** Vacia el carrito completo (no genera eventos ITEM_ELIMINADO). */
export async function vaciarCarrito(token) {
  const cliente = crearClienteApi(token);
  await cliente.delete('/api/carrito');
}