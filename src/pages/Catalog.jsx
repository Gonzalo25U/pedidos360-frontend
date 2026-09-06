import { useEffect, useState } from 'react';
import { listarProductosPublico } from '../api/productosApi';
import { agregarAlCarrito } from '../api/carritoApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

/**
 * Catalogo PUBLICO: se carga sin pedir login (usa /publico/productos, que
 * no exige token ni en el Gateway ni en productos-ms). El login solo se
 * dispara cuando el usuario intenta agregar un producto al carrito.
 */
export default function Catalog() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [idAgregando, setIdAgregando] = useState(null);
  const { obtenerToken } = useAccessToken();
  const mostrarToast = useToast();
  const { actualizarContador } = useCart();

  useEffect(() => {
    listarProductosPublico()
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el catálogo. Intenta de nuevo más tarde.'))
      .finally(() => setCargando(false));
  }, []);

  async function manejarAgregar(producto) {
    setIdAgregando(producto.id);
    try {
      const token = await obtenerToken(); // pide login aqui si no hay sesion
      await agregarAlCarrito(token, {
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: producto.precio,
      });
      mostrarToast(`"${producto.nombre}" se agregó a tu carrito`, 'exito');
      actualizarContador();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo agregar el producto al carrito', 'error');
    } finally {
      setIdAgregando(null);
    }
  }

  if (cargando) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p>Cargando catálogo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-container">
        <p className="state-icon">⚠️</p>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Catálogo</h1>
        <p className="page-subtitle">Explora nuestros productos, sin necesidad de iniciar sesión.</p>
      </div>

      {productos.length === 0 ? (
        <div className="state-container">
          <p className="state-icon">📦</p>
          <p>Todavía no hay productos disponibles.</p>
        </div>
      ) : (
        <div className="product-grid">
          {productos.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              onAgregar={manejarAgregar}
              agregando={idAgregando === producto.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
