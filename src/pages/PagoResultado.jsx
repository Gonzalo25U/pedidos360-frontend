import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { vaciarCarrito } from '../api/pagosApi';
import { useAccessToken } from '../hooks/useAccessToken';
import { useCart } from '../context/CartContext';

const MENSAJES = {
  APROBADO: {
    icono: '✅',
    titulo: '¡Pago aprobado!',
    texto: 'Tu pedido se está creando. Aparecerá en "Mis pedidos" en unos segundos y te enviaremos un correo.',
  },
  RECHAZADO: {
    icono: '❌',
    titulo: 'Pago rechazado',
    texto: 'Webpay rechazó la transacción. Tu carrito sigue intacto: puedes intentarlo de nuevo.',
  },
  CANCELADO: {
    icono: '↩️',
    titulo: 'Pago cancelado',
    texto: 'No se realizó ningún cargo. Tu carrito sigue intacto.',
  },
};

/**
 * Pagina a la que pago-ms redirige (302) despues de que Webpay devuelve al
 * usuario: .../pago/resultado?estado=APROBADO|RECHAZADO|CANCELADO&orden=...
 * El estado real ya lo decidio el servidor (commit contra Transbank); aqui
 * solo se muestra y, si fue aprobado, se vacia el carrito.
 */
export default function PagoResultado() {
  const [params] = useSearchParams();
  const estado = params.get('estado') || 'ERROR';
  const orden = params.get('orden');

  const { obtenerToken } = useAccessToken();
  const { actualizarContador } = useCart();
  const [errorVaciar, setErrorVaciar] = useState(false);
  const yaVacio = useRef(false);

  useEffect(() => {
    if (estado !== 'APROBADO' || yaVacio.current) return;
    yaVacio.current = true;

    (async () => {
      try {
        const token = await obtenerToken();
        await vaciarCarrito(token);
        actualizarContador();
      } catch {
        setErrorVaciar(true);
      }
    })();
  }, [estado, obtenerToken, actualizarContador]);

  const info = MENSAJES[estado] || {
    icono: '⚠️',
    titulo: 'No pudimos confirmar el pago',
    texto: 'Ocurrió un problema al procesar el resultado. Revisa "Mis pedidos" antes de volver a pagar.',
  };

  return (
    <div className="state-container">
      <p className="state-icon">{info.icono}</p>
      <h2>{info.titulo}</h2>
      <p>{info.texto}</p>
      {orden && <p>Orden de compra: <strong>{orden}</strong></p>}
      {errorVaciar && (
        <p>No pudimos vaciar tu carrito automáticamente. Puedes quitar los productos desde el carrito.</p>
      )}
      <p>
        {estado === 'APROBADO' ? (
          <Link to="/pedidos"><button>Ver mis pedidos</button></Link>
        ) : (
          <Link to="/carrito"><button>Volver al carrito</button></Link>
        )}{' '}
        <Link to="/"><button className="btn-secondary">Seguir comprando</button></Link>
      </p>
    </div>
  );
}