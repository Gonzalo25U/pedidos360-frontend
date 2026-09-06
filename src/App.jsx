import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import './App.css';

/**
 * Envoltorio simple para rutas que requieren login. Si el usuario no esta
 * autenticado, dispara el popup de login en vez de redirigir a una pagina
 * de "acceso denegado" - asi la experiencia es fluida: "quiero ver mi
 * carrito" -> se loguea ahi mismo -> ve su carrito.
 */
function RutaProtegida({ children }) {
  const estaLogueado = useIsAuthenticated();
  const { instance } = useMsal();

  if (!estaLogueado) {
    instance.loginPopup(loginRequest).then((respuesta) => {
      instance.setActiveAccount(respuesta.account);
    });
    return <p>Necesitas iniciar sesión para ver esta página...</p>;
  }

  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
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
            </Routes>
          </main>
        </BrowserRouter>
      </CartProvider>
    </ToastProvider>
  );
}
