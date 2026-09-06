import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Crea un cliente axios. Si se pasa un token, lo agrega como Bearer.
 * Sin token, sirve para llamar a las rutas publicas (catalogo).
 */
export function crearClienteApi(token) {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
