import { createContext, useContext, useState, useCallback } from 'react';
import { useAccessToken } from '../hooks/useAccessToken';
import { listarCarrito } from '../api/carritoApi';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cantidad, setCantidad] = useState(0);
  const { obtenerToken, estaLogueado } = useAccessToken();

  const actualizarContador = useCallback(async () => {
    if (!estaLogueado) {
      setCantidad(0);
      return;
    }
    try {
      const token = await obtenerToken();
      const items = await listarCarrito(token);
      setCantidad(items.reduce((acc, i) => acc + i.cantidad, 0));
    } catch {
      // Si falla, no rompemos la UI, solo dejamos el contador como estaba.
    }
  }, [estaLogueado, obtenerToken]);

  return (
    <CartContext.Provider value={{ cantidad, actualizarContador }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const contexto = useContext(CartContext);
  if (!contexto) {
    throw new Error('useCart debe usarse dentro de <CartProvider>');
  }
  return contexto;
}
