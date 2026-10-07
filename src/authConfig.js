export const redirectUri = import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/`;

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_FRONTEND_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri,
    postLogoutRedirectUri: redirectUri,
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