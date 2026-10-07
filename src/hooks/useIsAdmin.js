import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { decodeJwt } from '../utils/jwt';

export function useIsAdmin() {
  const [esAdmin, setEsAdmin] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const { estaLogueado, proveedor, obtenerToken } = useAuth();

  useEffect(() => {
    if (!estaLogueado) {
      setEsAdmin(false);
      setVerificando(false);
      return;
    }
    setVerificando(true);
    (async () => {
      try {
        const token = await obtenerToken();
        const payload = decodeJwt(token) || {};
        const lista = [...(payload.roles || []), ...(payload['cognito:groups'] || [])];
        setEsAdmin(lista.some((r) => String(r).toLowerCase() === 'admin'));
      } catch {
        setEsAdmin(false);
      } finally {
        setVerificando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaLogueado, proveedor]);

  return { esAdmin, verificando };
}