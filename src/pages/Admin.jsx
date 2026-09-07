import { useEffect, useState } from 'react';
import {
  listarProductosPublico,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../api/productosApi';
import { listarTodosLosPedidos } from '../api/pedidosApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { useToast } from '../context/ToastContext';

const PRODUCTO_VACIO = { nombre: '', descripcion: '', precio: '', stock: '', categoria: '' };

export default function Admin() {
  const { esAdmin, verificando } = useIsAdmin();
  const { obtenerToken } = useAccessToken();
  const mostrarToast = useToast();

  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(PRODUCTO_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargarProductos() {
    const data = await listarProductosPublico();
    setProductos(data);
  }

  async function cargarPedidos() {
    const token = await obtenerToken();
    const data = await listarTodosLosPedidos(token);
    setPedidos(data);
  }

  useEffect(() => {
    if (!esAdmin) return;
    setCargando(true);
    Promise.all([cargarProductos(), cargarPedidos()])
      .catch((err) => {
        console.error(err);
        mostrarToast('No se pudo cargar la información de administrador', 'error');
      })
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin]);

  function manejarCambioFormulario(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  }

  function limpiarFormulario() {
    setFormulario(PRODUCTO_VACIO);
    setEditandoId(null);
  }

  async function manejarGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const token = await obtenerToken();
      const producto = {
        nombre: formulario.nombre,
        descripcion: formulario.descripcion,
        precio: parseFloat(formulario.precio),
        stock: parseInt(formulario.stock, 10),
        categoria: formulario.categoria,
      };
      if (editandoId) {
        await actualizarProducto(token, editandoId, producto);
        mostrarToast('Producto actualizado', 'exito');
      } else {
        await crearProducto(token, producto);
        mostrarToast('Producto creado', 'exito');
      }
      limpiarFormulario();
      cargarProductos();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo guardar el producto', 'error');
    } finally {
      setGuardando(false);
    }
  }

  function manejarEditar(producto) {
    setEditandoId(producto.id);
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      categoria: producto.categoria || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function manejarEliminar(id, nombre) {
    try {
      const token = await obtenerToken();
      await eliminarProducto(token, id);
      mostrarToast(`"${nombre}" eliminado`, 'info');
      cargarProductos();
    } catch (err) {
      console.error(err);
      mostrarToast('No se pudo eliminar el producto', 'error');
    }
  }

  if (verificando) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p>Verificando permisos...</p>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="state-container">
        <p className="state-icon">🔒</p>
        <p>No tienes permisos de administrador para ver esta página.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Panel de administración</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={tab === 'productos' ? 'admin-tab admin-tab-activo' : 'admin-tab btn-secondary'}
          onClick={() => setTab('productos')}
        >
          Productos
        </button>
        <button
          className={tab === 'pedidos' ? 'admin-tab admin-tab-activo' : 'admin-tab btn-secondary'}
          onClick={() => setTab('pedidos')}
        >
          Todos los pedidos
        </button>
      </div>

      {cargando ? (
        <div className="state-container">
          <div className="spinner" />
          <p>Cargando...</p>
        </div>
      ) : tab === 'productos' ? (
        <div>
          <form className="admin-form" onSubmit={manejarGuardar}>
            <h3>{editandoId ? 'Editar producto' : 'Nuevo producto'}</h3>
            <div className="admin-form-grid">
              <input
                name="nombre"
                placeholder="Nombre"
                value={formulario.nombre}
                onChange={manejarCambioFormulario}
                required
              />
              <input
                name="categoria"
                placeholder="Categoría"
                value={formulario.categoria}
                onChange={manejarCambioFormulario}
              />
              <input
                name="precio"
                type="number"
                step="0.01"
                placeholder="Precio"
                value={formulario.precio}
                onChange={manejarCambioFormulario}
                required
              />
              <input
                name="stock"
                type="number"
                placeholder="Stock"
                value={formulario.stock}
                onChange={manejarCambioFormulario}
                required
              />
            </div>
            <textarea
              name="descripcion"
              placeholder="Descripción"
              value={formulario.descripcion}
              onChange={manejarCambioFormulario}
            />
            <div className="admin-form-actions">
              <button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear producto'}
              </button>
              {editandoId && (
                <button type="button" className="btn-secondary" onClick={limpiarFormulario}>
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {productos.length === 0 ? (
            <div className="state-container">
              <p className="state-icon">📦</p>
              <p>Todavía no hay productos cargados.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria}</td>
                    <td>${p.precio}</td>
                    <td>{p.stock}</td>
                    <td className="admin-table-actions">
                      <button className="btn-secondary" onClick={() => manejarEditar(p)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => manejarEliminar(p.id, p.nombre)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="state-container">
          <p className="state-icon">📋</p>
          <p>Todavía no hay pedidos registrados.</p>
        </div>
      ) : (
        <ul className="orders-list">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="order-card">
              <div className="order-header">
                <strong>
                  Pedido #{pedido.id} — <span className="order-user">{pedido.usuarioId}</span>
                </strong>
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
      )}
    </div>
  );
}
