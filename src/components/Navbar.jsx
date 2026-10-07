import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function Navbar() {
  const { estaLogueado, proveedor, nombreUsuario, abrirLogin, cerrarSesion } = useAuth();
  const location = useLocation();
  const { cantidad, actualizarContador } = useCart();
  const { esAdmin } = useIsAdmin();

  useEffect(() => {
    if (estaLogueado) {
      actualizarContador();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaLogueado]);

  function esActiva(ruta) {
    return location.pathname === ruta;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🛍️ Pedidos360</Link>
      </div>

      <div className="navbar-links">
        <Link to="/" className={esActiva('/') ? 'nav-link nav-link-activo' : 'nav-link'}>
          Catálogo
        </Link>
        {estaLogueado && (
          <Link to="/pedidos" className={esActiva('/pedidos') ? 'nav-link nav-link-activo' : 'nav-link'}>
            Mis pedidos
          </Link>
        )}
        {esAdmin && (
          <Link to="/admin" className={esActiva('/admin') ? 'nav-link nav-link-activo' : 'nav-link'}>
            ⚙️ Admin
          </Link>
        )}
      </div>

      <div className="navbar-auth">
        {estaLogueado && (
          <Link to="/carrito" className={`cart-button ${esActiva('/carrito') ? 'cart-button-activo' : ''}`}>
            <span className="cart-icon">🛒</span>
            <span>Carrito</span>
            {cantidad > 0 && <span className="cart-badge">{cantidad}</span>}
          </Link>
        )}

        {estaLogueado ? (
          <div className="navbar-user-group">
            <span className="navbar-user">
              👤 {nombreUsuario}
              <span className={`provider-badge provider-badge-${proveedor}`}>
                {proveedor === 'cognito' ? 'Cognito' : 'Azure AD'}
              </span>
            </span>
            <button className="btn-secondary" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        ) : (
          <button onClick={abrirLogin}>Iniciar sesión</button>
        )}
      </div>
    </nav>
  );
}