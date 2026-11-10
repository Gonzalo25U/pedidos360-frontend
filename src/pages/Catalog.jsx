import { useCallback, useEffect, useRef, useState } from 'react';
import { listarProductosPublico, registrarVistaProducto } from '../api/productosApi';
import { agregarAlCarrito } from '../api/carritoApi';
import { listarRecomendaciones } from '../api/recomendacionesApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

const ETIQUETAS = {
  SIMILARES: 'A otros usuarios también les interesó',
  POPULAR: 'Popular ahora',
};

/**
 * Catalogo PUBLICO: se carga sin pedir login (usa /publico/productos, que
 * no exige token ni en el Gateway ni en productos-ms). El login solo se
 * dispara cuando el usuario intenta agregar un producto al carrito.
 *
 * Clickstream (solo con sesion iniciada):
 *  - al hacer clic en un producto se avisa a productos-ms (PRODUCTO_VISTO -> Kafka)
 *  - el bloque "Recomendados para ti" viene de analytics-ms (DynamoDB)
 */
export default function Catalog() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [idAgregando, setIdAgregando] = useState(null);
  const [recomendados, setRecomendados] = useState([]);
  const vistosRef = useRef(new Set()); // evita reenviar la misma vista en esta visita
  const { obtenerToken, estaLogueado } = useAccessToken();
  const mostrarToast = useToast();
  const { actualizarContador } = useCart();

  useEffect(() => {
    listarProductosPublico()
      .then(setProductos)
      .catch(() => setError('No se pudo cargar el catálogo. Intenta de nuevo más tarde.'))
      .finally(() => setCargando(false));
  }, []);

  const cargarRecomendaciones = useCallback(async () => {
    if (!estaLogueado) {
      setRecomendados([]);
      return;
    }
    try {
      const token = await obtenerToken();
      setRecomendados(await listarRecomendaciones(token, 4));
    } catch {
      // Las recomendaciones son opcionales: si fallan, el catalogo sigue igual.
      setRecomendados([]);
    }
  }, [estaLogueado, obtenerToken]);

  useEffect(() => {
    cargarRecomendaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estaLogueado]);

  function manejarVer(producto) {
    if (!estaLogueado || vistosRef.current.has(producto.id)) return;
    vistosRef.current.add(producto.id);
    // fire-and-forget: nunca bloquea ni muestra errores al usuario
    obtenerToken()
      .then((token) => registrarVistaProducto(token, producto.id))
      .catch(() => vistosRef.current.delete(producto.id));
  }

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
      // el evento viaja por Kafka -> analytics-ms: se da ~1.5 s antes de recalcular
      setTimeout(cargarRecomendaciones, 1500);
    } catch (err) {
      // Sin sesion: se abrio el selector de login, no es un error real.
      if (err?.codigo === 'NO_AUTENTICADO') return;
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

  // Une cada recomendacion con el producto real del catalogo (para tener stock, descripcion, etc.)
  const tarjetasRecomendadas = recomendados
    .map((r) => ({ producto: productos.find((p) => p.id === r.productoId), motivo: r.motivo }))
    .filter((r) => r.producto);

  return (
    <div>
      <div className="page-header">
        <h1>Catálogo</h1>
        <p className="page-subtitle">Explora nuestros productos, sin necesidad de iniciar sesión.</p>
      </div>

      {tarjetasRecomendadas.length > 0 && (
        <section className="recomendados">
          <h2>Recomendados para ti</h2>
          <div className="product-grid">
            {tarjetasRecomendadas.map(({ producto, motivo }) => (
              <ProductCard
                key={`rec-${producto.id}`}
                producto={producto}
                onAgregar={manejarAgregar}
                agregando={idAgregando === producto.id}
                onVer={manejarVer}
                etiqueta={ETIQUETAS[motivo] || null}
              />
            ))}
          </div>
        </section>
      )}

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
              onVer={manejarVer}
            />
          ))}
        </div>
      )}
    </div>
  );
}