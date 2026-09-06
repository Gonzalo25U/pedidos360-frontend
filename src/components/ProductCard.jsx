export default function ProductCard({ producto, onAgregar, agregando }) {
  const sinStock = producto.stock <= 0;

  return (
    <div className="product-card">
      <div className="product-card-image">📦</div>
      <div className="product-card-body">
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
