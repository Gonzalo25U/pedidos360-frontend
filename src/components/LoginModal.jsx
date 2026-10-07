import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { modalAbierto, cerrarModal, loginAzure, loginCognito, cognitoDisponible } = useAuth();
  const [error, setError] = useState(null);

  if (!modalAbierto) return null;

  async function conAzure() {
    setError(null);
    try {
      await loginAzure();
    } catch (e) {
      console.error(e);
      // El usuario cerro el popup: no es un error que valga la pena mostrar.
      if (e?.errorCode !== 'user_cancelled') setError('No se pudo iniciar sesión con Microsoft.');
    }
  }

  async function conCognito() {
    setError(null);
    try {
      await loginCognito();
    } catch (e) {
      console.error(e);
      setError('No se pudo iniciar sesión con Cognito.');
    }
  }

  return (
    <div className="modal-overlay" onClick={cerrarModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Iniciar sesión</h2>
        <p className="modal-subtitle">Elige cómo quieres entrar a Pedidos360.</p>

        <button className="login-option login-option-azure" onClick={conAzure}>
          <span className="login-option-title">Continuar con Microsoft</span>
          <span className="login-option-desc">Cuenta corporativa (Azure AD / Entra ID)</span>
        </button>

        {cognitoDisponible && (
          <button className="login-option login-option-cognito" onClick={conCognito}>
            <span className="login-option-title">Continuar con Amazon Cognito</span>
            <span className="login-option-desc">Inicia sesión o crea una cuenta nueva</span>
          </button>
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn-secondary modal-cancel" onClick={cerrarModal}>
          Cancelar
        </button>
      </div>
    </div>
  );
}