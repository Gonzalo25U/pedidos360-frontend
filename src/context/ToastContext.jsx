import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

/**
 * Reemplaza los alert() nativos del navegador por notificaciones flotantes,
 * mas agradables y sin bloquear la interaccion del usuario. Uso:
 *   const mostrarToast = useToast();
 *   mostrarToast('Producto agregado', 'exito');
 *   mostrarToast('Algo salio mal', 'error');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const mostrarToast = useCallback((mensaje, tipo = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={mostrarToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return contexto;
}
