const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_FRONTEND_CLIENT_ID,
    authority: tenantId
      ? `https://login.microsoftonline.com/${tenantId}`
      : 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: [
    `api://${import.meta.env.VITE_AZURE_API_CLIENT_ID}/Carrito.ReadWrite`,
    'openid',
    'profile',
  ],
};