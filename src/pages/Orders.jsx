import { useEffect, useState } from 'react';
import { listarMisPedidos } from '../api/pedidosApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useToast } from '../context/ToastContext';

export default function Orders() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { obtenerToken } = useAccessToken();
  const mostrarToast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const token = await obtenerToken();
        const data = await listarMisPedidos(token);
        setPedidos(data);
      } catch (err) {
        console.error(err);
        mostrarToast('No se pudieron cargar tus pedidos', 'error');
      } finally {
        setCargando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p>Cargando tus pedidos...</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="state-container">
        <p className="state-icon">📋</p>
        <p>Todavía no tienes pedidos.</p>
        <p className="page-subtitle">Cuando confirmes una compra, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Mis pedidos</h1>
      </div>
      <ul className="orders-list">
        {pedidos.map((pedido) => (
          <li key={pedido.id} className="order-card">
            <div className="order-header">
              <strong>Pedido #{pedido.id}</strong>
              <span className={`order-status order-status-${pedido.estado.toLowerCase()}`}>
                {pedido.estado}
              </span>
            </div>
            <ul className="order-items">
              {pedido.items.map((item, idx) => (
                <li key={idx}>
                  {item.nombreProducto} — Cant: {item.cantidad} — ${item.precioUnitario}
                </li>
              ))}
            </ul>
            <p className="order-total">Total: ${pedido.total}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
