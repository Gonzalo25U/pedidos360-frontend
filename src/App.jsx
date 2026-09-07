import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';
import './App.css';


function RutaProtegida({ children }) {
  const estaLogueado = useIsAuthenticated();
  const { instance } = useMsal();
  const intentandoLogin = useRef(false);

  useEffect(() => {
    if (!estaLogueado && !intentandoLogin.current) {
      intentandoLogin.current = true;
      instance
        .loginPopup(loginRequest)
        .then((respuesta) => {
          instance.setActiveAccount(respuesta.account);
        })
        .finally(() => {
          intentandoLogin.current = false;
        });
    }
  }, [estaLogueado, instance]);

  if (!estaLogueado) {
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
  );
}