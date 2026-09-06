import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarCarrito, eliminarDelCarrito } from '../api/carritoApi';
import { crearPedido } from '../api/pedidosApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoPedido, setProcesandoPedido] = useState(false);
  const { obtenerToken } = useAccessToken();
  const mostrarToast = useToast();
  const { actualizarContador } = useCart();
  const navigate = useNavigate();

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

  async function manejarCheckout() {
    if (items.length === 0) return;
    setProcesandoPedido(true);
    try {
      const token = await obtenerToken();
      const itemsPedido = items.map((i) => ({
        productoId: i.productoId,
        nombreProducto: i.nombreProducto,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      }));
      await crearPedido(token, itemsPedido);
      for (const item of items) {
        await eliminarDelCarrito(token, item.id);
      }
      mostrarToast('¡Tu pedido fue creado con éxito!', 'exito');
      actualizarContador();
      navigate('/pedidos');
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo procesar el pedido', 'error');
    } finally {
      setProcesandoPedido(false);
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
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <span className="cart-total">Total: ${total.toFixed(2)}</span>
            <button onClick={manejarCheckout} disabled={procesandoPedido}>
              {procesandoPedido ? 'Procesando...' : 'Confirmar pedido'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
