import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';

/**
 * Devuelve una funcion "obtenerToken()" que:
 * - Si ya hay sesion, intenta renovar el token en silencio (sin popup).
 * - Si no hay sesion o el silent falla, abre el popup de login de Microsoft.
 *
 * Esto es lo que permite el flujo "catalogo publico, login solo al comprar":
 * las paginas de carrito/checkout llaman a obtenerToken() recien cuando el
 * usuario intenta agregar algo o pagar, no al cargar la app.
 */
export function useAccessToken() {
  const { instance, accounts } = useMsal();

  async function obtenerToken() {
    const account = accounts[0] || instance.getActiveAccount();

    if (account) {
      try {
        const respuesta = await instance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        return respuesta.accessToken;
      } catch (error) {
        if (!(error instanceof InteractionRequiredAuthError)) {
          throw error;
        }
        // Cae al popup si el silent no puede renovar solo.
      }
    }

    const respuesta = await instance.loginPopup(loginRequest);
    instance.setActiveAccount(respuesta.account);
    return respuesta.accessToken;
  }

  return { obtenerToken, estaLogueado: accounts.length > 0 };
}
