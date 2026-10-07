import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import './App.css';

/**
 * Envoltorio simple para rutas que requieren login. Si el usuario no esta
 * autenticado, dispara el popup de login en vez de redirigir a una pagina
 * de "acceso denegado" - asi la experiencia es fluida: "quiero ver mi
 * carrito" -> se loguea ahi mismo -> ve su carrito.
 */
function RutaProtegida({ children }) {
  const { estaLogueado, abrirLogin } = useAuth();
  const yaPidioLogin = useRef(false);

  useEffect(() => {
    if (!estaLogueado && !yaPidioLogin.current) {
      yaPidioLogin.current = true;
      abrirLogin();
    }
    if (estaLogueado) yaPidioLogin.current = false;
  }, [estaLogueado, abrirLogin]);

  if (!estaLogueado) {
    return (
      <div className="state-container">
        <p className="state-icon">🔐</p>
        <p>Necesitas iniciar sesión para ver esta página.</p>
        <button onClick={abrirLogin}>Iniciar sesión</button>
      </div>
    );
  }

  return children;
}

export default function App() {
  const basename = import.meta.env.VITE_BASE_PATH || '';

  return (
    <AuthProvider>
    <ToastProvider>
      <CartProvider>
        <BrowserRouter basename={basename}>
          <Navbar />
          <LoginModal />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route
                path="/carrito"
                element={
                  <RutaProtegida>
                    <Cart />
                  </RutaProtegida>
                }
              />
              <Route
                path="/pedidos"
                element={
                  <RutaProtegida>
                    <Orders />
                  </RutaProtegida>
                }
              />
              <Route
                path="/admin"
                element={
                  <RutaProtegida>
                    <Admin />
                  </RutaProtegida>
                }
              />
            </Routes>
          </main>
        </BrowserRouter>
      </CartProvider>
    </ToastProvider>
    </AuthProvider>
  );
}