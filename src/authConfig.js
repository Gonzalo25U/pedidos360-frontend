/**
 * Configuracion de MSAL para Pedidos360.
 *
 * authority: "common" porque el App Registration del frontend esta configurado
 * como multi-tenant + cuentas personales de Microsoft (cualquier usuario de
 * Microsoft puede loguearse, sin importar de que organizacion venga).
 *
 * El flujo usado es Authorization Code con PKCE, que MSAL.js maneja
 * automaticamente para SPAs - nunca se usa (ni se necesita) un client secret.
 */
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_FRONTEND_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

/**
 * Scopes que se piden al iniciar sesion. Incluye el scope custom de la API
 * (Carrito.ReadWrite) ademas de los estandar de OpenID Connect.
 */
export const loginRequest = {
  scopes: [
    `api://${import.meta.env.VITE_AZURE_API_CLIENT_ID}/Carrito.ReadWrite`,
    'openid',
    'profile',
  ],
};
