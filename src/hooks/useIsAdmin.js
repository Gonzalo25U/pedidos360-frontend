import { useState, useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { useAccessToken } from './useAccessToken';
import { decodeJwt } from '../utils/jwt';

export function useIsAdmin() {
  const [esAdmin, setEsAdmin] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const estaLogueado = useIsAuthenticated();
  const { obtenerToken } = useAccessToken();

  useEffect(() => {
    if (!estaLogueado) {
      setEsAdmin(false);
      setVerificando(false);
      return;
    }
    (async () => {
      try {
        const token = await obtenerToken();
        const payload = decodeJwt(token);
        const roles = payload?.roles || [];
        setEsAdmin(roles.includes('Admin'));
      } catch {
        setEsAdmin(false);
      } finally {
        setVerificando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaLogueado]);

  return { esAdmin, verificando };
}
