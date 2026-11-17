import { useEffect, useRef, useState } from 'react';
import { useIsAdmin } from '../hooks/useIsAdmin';
import './Dashboard.css';

// URL del API Gateway WebSocket (backend de metricas). Se puede sobreescribir en el
// build con VITE_WS_URL; si no, usa la del entorno actual.
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://ldwnepsan2.execute-api.us-east-1.amazonaws.com/prod';

const TIPOS_EVENTO = {
  PRODUCTO_VISTO: { icono: '👁️', texto: 'Vio' },
  ITEM_AGREGADO: { icono: '🛒', texto: 'Agregó al carrito' },
  ITEM_ELIMINADO: { icono: '➖', texto: 'Quitó del carrito' },
  COMPRA_APROBADA: { icono: '✅', texto: 'Compra aprobada' },
};

const MAX_EVENTOS = 12;

/**
 * Se conecta al WebSocket, pide la foto inicial y escucha los broadcasts.
 * Se reconecta solo si se corta, y envia un "ping" periodico (API Gateway cierra
 * las conexiones inactivas a los 10 min).
 */
function useMetricasEnVivo(url) {
  const [estado, setEstado] = useState('conectando'); // conectando | conectado | reconectando
  const [datos, setDatos] = useState(null);
  const [eventos, setEventos] = useState([]);
  const contador = useRef(0);

  useEffect(() => {
    if (!url) return undefined;
    let ws;
    let cerrado = false;
    let reintento;
    let ping;

    function conectar() {
      ws = new WebSocket(url);

      ws.onopen = () => {
        setEstado('conectado');
        ws.send(JSON.stringify({ action: 'snapshot' }));
        ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'snapshot' }));
        }, 4 * 60 * 1000);
      };

      ws.onmessage = (msg) => {
        try {
          const d = JSON.parse(msg.data);
          if (d.tipo !== 'snapshot') return;
          setDatos(d);
          if (d.eventos && d.eventos.length > 0) {
            const nuevos = d.eventos.map((e) => ({ ...e, id: contador.current++ })).reverse();
            setEventos((prev) => [...nuevos, ...prev].slice(0, MAX_EVENTOS));
          }
        } catch {
          // mensaje que no es JSON: se ignora
        }
      };

      ws.onclose = () => {
        clearInterval(ping);
        if (!cerrado) {
          setEstado('reconectando');
          reintento = setTimeout(conectar, 3000);
        }
      };

      ws.onerror = () => ws.close();
    }

    conectar();
    return () => {
      cerrado = true;
      clearTimeout(reintento);
      clearInterval(ping);
      if (ws) ws.close();
    };
  }, [url]);

  return { estado, datos, eventos };
}

function formatear(n) {
  return Number(n || 0).toLocaleString('es-CL');
}

function hora(ts) {
  return new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function Kpi({ icono, titulo, valor, sufijo = '' }) {
  return (
    <div className="kpi">
      <span className="kpi-icono">{icono}</span>
      <span className="kpi-titulo">{titulo}</span>
      {/* key={valor}: al cambiar el numero se re-monta y repite la animacion */}
      <span key={valor} className="kpi-valor kpi-pulso">{valor}{sufijo}</span>
    </div>
  );
}

function Ranking({ titulo, icono, filas }) {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <section className="dash-card">
      <h2>{icono} {titulo}</h2>
      {filas.length === 0 ? (
        <p className="dash-vacio">Aún no hay datos.</p>
      ) : (
        <ol className="ranking">
          {filas.map((f, i) => (
            <li key={f.nombre}>
              <div className="ranking-linea">
                <span className="ranking-pos">{i + 1}</span>
                <span className="ranking-nombre" title={f.nombre}>{f.nombre}</span>
                <span className="ranking-valor">{formatear(f.valor)}</span>
              </div>
              <div className="ranking-barra">
                <div className="ranking-barra-relleno" style={{ width: `${(f.valor / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { esAdmin, verificando } = useIsAdmin();
  const { estado, datos, eventos } = useMetricasEnVivo(esAdmin ? WS_URL : null);

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

  const t = datos?.totales;
  const etiquetaEstado = {
    conectado: '🟢 En vivo',
    conectando: '🟡 Conectando...',
    reconectando: '🟠 Reconectando...',
  }[estado];

  return (
    <div className="dashboard">
      <div className="page-header dash-encabezado">
        <div>
          <h1>Métricas en tiempo real</h1>
          <p className="page-subtitle">
            Comportamiento de los usuarios en la tienda, vía Kafka → DynamoDB Streams → WebSocket.
          </p>
        </div>
        <span className={`dash-estado dash-estado-${estado}`}>{etiquetaEstado}</span>
      </div>

      {!datos ? (
        <div className="state-container">
          <div className="spinner" />
          <p>Esperando datos...</p>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <Kpi icono="👁️" titulo="Vistas de producto" valor={formatear(t.vistas)} />
            <Kpi icono="🛒" titulo="Agregados al carrito" valor={formatear(t.agregados)} />
            <Kpi icono="✅" titulo="Compras aprobadas" valor={formatear(t.compras)} />
            <Kpi icono="📈" titulo="Conversión (compras / vistas)" valor={t.conversion} sufijo="%" />
          </div>

          <div className="dash-grid">
            <Ranking titulo="Más vistos" icono="👁️" filas={datos.topVistos} />
            <Ranking titulo="Más agregados al carrito" icono="🛒" filas={datos.topAgregados} />
            <Ranking titulo="Más comprados" icono="✅" filas={datos.topCompras} />

            <section className="dash-card">
              <h2>⚡ Actividad en vivo</h2>
              {eventos.length === 0 ? (
                <p className="dash-vacio">Esperando actividad... navega por la tienda para ver eventos aquí.</p>
              ) : (
                <ul className="feed">
                  {eventos.map((e) => {
                    const info = TIPOS_EVENTO[e.tipo] || { icono: '•', texto: e.tipo };
                    return (
                      <li key={e.id} className="feed-item">
                        <span className="feed-icono">{info.icono}</span>
                        <span className="feed-texto">
                          <strong>{info.texto}</strong> · {e.producto}
                        </span>
                        <span className="feed-hora">{hora(e.ts)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}