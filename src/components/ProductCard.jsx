export default function ProductCard({ producto, onAgregar, agregando, onVer, etiqueta }) {
  const sinStock = producto.stock <= 0;

  return (
    // onVer (opcional): clickstream. Se dispara al hacer clic en cualquier parte de la tarjeta.
    <div className="product-card" onClick={() => onVer?.(producto)}>
      <div className="product-card-image">📦</div>
      <div className="product-card-body">
        {etiqueta && <span className="product-badge">{etiqueta}</span>}
        <h3>{producto.nombre}</h3>
        <p className="product-description">{producto.descripcion}</p>
        <div className="product-card-footer">
          <span className="product-price">${producto.precio}</span>
          <span className={`product-stock ${sinStock ? 'product-stock-agotado' : ''}`}>
            {sinStock ? 'Agotado' : `${producto.stock} disponibles`}
          </span>
        </div>
        <button onClick={() => onAgregar(producto)} disabled={agregando || sinStock}>
          {agregando ? 'Agregando...' : sinStock ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
}