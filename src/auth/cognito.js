import { redirectUri } from '../authConfig';

const DOMINIO = (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, '');
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
// OJO: "profile" NO esta permitido en este app client (da "Invalid request").
const SCOPES = 'openid email phone';

const CLAVE_SESION = 'pedidos360.cognito.sesion';
const CLAVE_PKCE = 'pedidos360.cognito.pkce';

export const cognitoConfigurado = Boolean(DOMINIO && CLIENT_ID);

// ---------- utilidades ----------
function base64Url(bytes) {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function aleatorio(longitud = 32) {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(texto) {
  const datos = new TextEncoder().encode(texto);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', datos));
}

function decodificar(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(payload))));
  } catch {
    return null;
  }
}

function leerSesion() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}

function sesionDesdeRespuesta(data, refreshAnterior) {
  const claims = decodificar(data.access_token);
  return {
    accessToken: data.access_token,
    idToken: data.id_token || null,
    refreshToken: data.refresh_token || refreshAnterior || null,
    expiraEn: (claims?.exp || 0) * 1000,
  };
}

async function pedirTokens(params) {
  const respuesta = await fetch(`${DOMINIO}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
  });
  if (!respuesta.ok) {
    throw new Error(`Cognito token endpoint: ${respuesta.status}`);
  }
  return respuesta.json();
}

// ---------- API publica ----------

/** Redirige al Hosted UI de Cognito (login / crear cuenta). */
export async function iniciarLoginCognito() {
  if (!cognitoConfigurado) {
    throw new Error('Cognito no esta configurado (VITE_COGNITO_DOMAIN / VITE_COGNITO_CLIENT_ID)');
  }
  const verifier = aleatorio(48);
  const state = aleatorio(16);
  const challenge = base64Url(await sha256(verifier));
  sessionStorage.setItem(CLAVE_PKCE, JSON.stringify({ verifier, state }));

  const url = new URL(`${DOMINIO}/oauth2/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  window.location.assign(url.toString());
}

/**
 * Si la URL trae ?code=&state= de Cognito, canjea el code por tokens y
 * limpia la URL. Se llama UNA vez al arrancar la app (main.jsx).
 * Devuelve true si inicio sesion.
 */
export async function procesarCallbackCognito() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (!code && !error) return false;

  const guardado = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(CLAVE_PKCE));
    } catch {
      return null;
    }
  })();

  // Si no hay PKCE guardado, ese ?code= no es nuestro (ej. otro flujo): lo ignoramos.
  if (!guardado) return false;

  sessionStorage.removeItem(CLAVE_PKCE);
  limpiarUrl();

  if (error || !code || state !== guardado.state) {
    console.error('Login con Cognito fallido:', error || 'state invalido');
    return false;
  }

  try {
    const data = await pedirTokens({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: guardado.verifier,
    });
    guardarSesion(sesionDesdeRespuesta(data));
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function limpiarUrl() {
  const limpia = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, limpia);
}

/** Hay sesion de Cognito guardada (aunque el access token este vencido). */
export function haySesionCognito() {
  return Boolean(leerSesion()?.accessToken);
}

/** Devuelve un access token vigente (renueva con refresh token si hace falta). */
export async function obtenerTokenCognito() {
  const sesion = leerSesion();
  if (!sesion) throw new Error('Sin sesion de Cognito');

  // 60 s de margen antes del vencimiento real.
  if (sesion.expiraEn - 60_000 > Date.now()) return sesion.accessToken;

  if (!sesion.refreshToken) {
    cerrarSesionLocalCognito();
    throw new Error('Sesion de Cognito vencida');
  }
  try {
    const data = await pedirTokens({
      grant_type: 'refresh_token',
      refresh_token: sesion.refreshToken,
    });
    const nueva = sesionDesdeRespuesta(data, sesion.refreshToken);
    // El refresh no siempre devuelve id_token nuevo: conservamos el anterior.
    nueva.idToken = nueva.idToken || sesion.idToken;
    guardarSesion(nueva);
    return nueva.accessToken;
  } catch (e) {
    cerrarSesionLocalCognito();
    throw e;
  }
}

/** Nombre para mostrar en el navbar (email del ID token o username). */
export function nombreUsuarioCognito() {
  const sesion = leerSesion();
  if (!sesion) return '';
  const id = sesion.idToken ? decodificar(sesion.idToken) : null;
  const acc = decodificar(sesion.accessToken);
  return id?.email || id?.['cognito:username'] || acc?.username || 'Usuario Cognito';
}

export function cerrarSesionLocalCognito() {
  sessionStorage.removeItem(CLAVE_SESION);
  sessionStorage.removeItem(CLAVE_PKCE);
}

/** Cierra sesion local y en Cognito (redirige a /logout y vuelve al frontend). */
export function cerrarSesionCognito() {
  cerrarSesionLocalCognito();
  const url = new URL(`${DOMINIO}/logout`);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('logout_uri', redirectUri);
  window.location.assign(url.toString());
}