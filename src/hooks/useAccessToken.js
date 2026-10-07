import { useAuth } from '../context/AuthContext';

export function useAccessToken() {
  const { obtenerToken, estaLogueado } = useAuth();
  return { obtenerToken, estaLogueado };
}