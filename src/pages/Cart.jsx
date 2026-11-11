import { useEffect, useState } from 'react';
import { listarCarrito, eliminarDelCarrito } from '../api/carritoApi';
import { iniciarPago, redirigirAWebpay } from '../api/pagosApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const { obtenerToken } = useAccessToken();
  const mostrarToast = useToast();
  const { actualizarContador } = useCart();

  async function cargarCarrito() {
    setCargando(true);
    try {
      const token = await obtenerToken();
      const data = await listarCarrito(token);
      setItems(data);
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo cargar tu carrito', 'error');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCarrito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarEliminar(itemId, nombre) {
    try {
      const token = await obtenerToken();
      await eliminarDelCarrito(token, itemId);
      mostrarToast(`"${nombre}" se quitó del carrito`, 'info');
      cargarCarrito();
      actualizarContador();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo quitar el producto', 'error');
    }
  }

  /**
   * El pedido ya NO se crea aqui: se crea cuando Webpay aprueba el pago.
   * Flujo: pago-ms crea la transaccion con el carrito real -> redirigimos a
   * Webpay -> Webpay vuelve a pago-ms -> pago-ms redirige a /pago/resultado.
   */
  async function manejarPagar() {
    if (items.length === 0) return;
    setProcesandoPago(true);
    try {
      const token = await obtenerToken();
      const { url, token: tokenWs } = await iniciarPago(token);
      mostrarToast('Redirigiendo a Webpay...', 'info');
      redirigirAWebpay(url, tokenWs);
      // La pagina se va a Webpay: no se reactiva el boton a proposito.
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const detalle = err.response?.data;
      if (status === 429) {
        const hasta = detalle?.bloqueadoHasta
          ? new Date(detalle.bloqueadoHasta).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
          : null;
        mostrarToast(
          `Demasiados intentos de pago en poco tiempo. Tu cuenta quedó bloqueada temporalmente${hasta ? ` hasta las ${hasta}` : ''}.`,
          'error'
        );
      } else if (status === 400) {
        mostrarToast(detalle?.message || 'Tu carrito está vacío', 'error');
      } else {
        mostrarToast('No se pudo iniciar el pago. Intenta nuevamente.', 'error');
      }
      setProcesandoPago(false);
    }
  }

  if (cargando) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p>Cargando tu carrito...</p>
      </div>
    );
  }

  const total = items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Tu carrito</h1>
      </div>

      {items.length === 0 ? (
        <div className="state-container">
          <p className="state-icon">🛒</p>
          <p>Tu carrito está vacío.</p>
          <p className="page-subtitle">Agrega productos desde el catálogo para verlos aquí.</p>
        </div>
      ) : (
        <>
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.nombreProducto}</span>
                  <span className="cart-item-meta">
                    Cantidad: {item.cantidad} · ${item.precioUnitario} c/u
                  </span>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => manejarEliminar(item.id, item.nombreProducto)}
                  disabled={procesandoPago}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <span className="cart-total">Total: ${total.toFixed(2)}</span>
            <button onClick={manejarPagar} disabled={procesandoPago}>
              {procesandoPago ? 'Redirigiendo a Webpay...' : 'Pagar con Webpay'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}