import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../authConfig';
import {
  cognitoConfigurado,
  haySesionCognito,
  iniciarLoginCognito,
  obtenerTokenCognito,
  nombreUsuarioCognito,
  cerrarSesionCognito,
} from '../auth/cognito';

const AuthContext = createContext(null);

export class NoAutenticadoError extends Error {
  constructor() {
    super('NO_AUTENTICADO');
    this.codigo = 'NO_AUTENTICADO';
  }
}

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const azureLogueado = useIsAuthenticated();
  const [cognitoLogueado, setCognitoLogueado] = useState(haySesionCognito());
  const [modalAbierto, setModalAbierto] = useState(false);

  const proveedor = cognitoLogueado ? 'cognito' : azureLogueado ? 'azure' : null;
  const estaLogueado = proveedor !== null;

  const nombreUsuario =
    proveedor === 'cognito'
      ? nombreUsuarioCognito()
      : proveedor === 'azure'
        ? accounts[0]?.name || accounts[0]?.username || ''
        : '';

  const abrirLogin = useCallback(() => setModalAbierto(true), []);
  const cerrarModal = useCallback(() => setModalAbierto(false), []);

  const loginAzure = useCallback(async () => {
    const respuesta = await instance.loginPopup(loginRequest);
    instance.setActiveAccount(respuesta.account);
    setModalAbierto(false);
  }, [instance]);

  const loginCognito = useCallback(async () => {
    await iniciarLoginCognito(); // redirige: la pagina se recarga al volver
  }, []);

  const cerrarSesion = useCallback(async () => {
    if (cognitoLogueado) {
      cerrarSesionCognito(); // redirige
      return;
    }
    await instance.logoutPopup();
  }, [cognitoLogueado, instance]);

  /**
   * Devuelve un access token vigente del proveedor activo.
   * Si no hay sesion, abre el selector de login y lanza NoAutenticadoError
   * (quien llama simplemente no continua; el usuario reintenta tras entrar).
   */
  const obtenerToken = useCallback(async () => {
    if (cognitoLogueado) {
      try {
        return await obtenerTokenCognito();
      } catch (e) {
        setCognitoLogueado(false);
        setModalAbierto(true);
        throw new NoAutenticadoError();
      }
    }

    const cuenta = accounts[0] || instance.getActiveAccount();
    if (cuenta) {
      try {
        const respuesta = await instance.acquireTokenSilent({ ...loginRequest, account: cuenta });
        return respuesta.accessToken;
      } catch (error) {
        if (!(error instanceof InteractionRequiredAuthError)) throw error;
        const respuesta = await instance.loginPopup(loginRequest);
        instance.setActiveAccount(respuesta.account);
        return respuesta.accessToken;
      }
    }

    setModalAbierto(true);
    throw new NoAutenticadoError();
  }, [cognitoLogueado, accounts, instance]);

  const valor = useMemo(
    () => ({
      estaLogueado,
      proveedor,
      nombreUsuario,
      obtenerToken,
      abrirLogin,
      cerrarModal,
      modalAbierto,
      loginAzure,
      loginCognito,
      cerrarSesion,
      cognitoDisponible: cognitoConfigurado,
    }),
    [
      estaLogueado, proveedor, nombreUsuario, obtenerToken, abrirLogin,
      cerrarModal, modalAbierto, loginAzure, loginCognito, cerrarSesion,
    ]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}