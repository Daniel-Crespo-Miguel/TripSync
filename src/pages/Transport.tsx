import { useEffect, useMemo, useState } from "react";
import { useGroup } from "../contexts/GroupContext";
import { auth } from "../firebase/firebaseConfig";
import "../styles/transport.css";
import AITransportPanel from "../components/AITransportPanel";
import { useParams } from "react-router-dom";

function toISODate(ts?: { seconds: number }) {
  if (!ts?.seconds) return "";
  const d = new Date(ts.seconds * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isValidISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

interface TransportOption {
  id: string;
  name: string;
  icon: string;
  duration: string;
  comfort: "baja" | "media" | "alta";
  cost: "€" | "€€" | "€€€";
  description: string;
  actions: {
    label: string;
    url: (params: { origin: string; destination: string; departDate: string; returnDate: string }) => string;
  }[];
}

const transportOptions: TransportOption[] = [
  {
    id: "avion",
    name: "Avión",
    icon: "✈️",
    duration: "El más rápido",
    comfort: "media",
    cost: "€€",
    description: "Ideal para distancias largas o cuando el tiempo es limitado.",
    actions: [
      {
        label: "Ver precios en Google Flights",
        url: (p) => {
          const base = `https://www.google.com/travel/flights?q=Flights%20to%20${encodeURIComponent(p.destination)}%20from%20${encodeURIComponent(p.origin)}`;
          const dates = p.departDate ? ` on ${encodeURIComponent(p.departDate)} through ${encodeURIComponent(p.returnDate || p.departDate)}` : '';
          return `${base}${dates}`;
        },
      },
      {
        label: "Ver rutas en Rome2Rio",
        url: (p) => `https://www.rome2rio.com/es/s/${encodeURIComponent(p.origin)}/${encodeURIComponent(p.destination)}`,
      },
    ],
  },
  {
    id: "tren",
    name: "Tren",
    icon: "🚆",
    duration: "Rápido y equilibrado",
    comfort: "alta",
    cost: "€€",
    description: "Cómodo y ecológico, con buenas conexiones en muchas rutas.",
    actions: [
      {
        label: "Ver trenes en Trainline",
        url: () => "https://www.thetrainline.com/es",
      },
      {
        label: "Ver opciones en Omio",
        url: () => "https://www.omio.es/",
      },
    ],
  },
  {
    id: "bus",
    name: "Autobús",
    icon: "🚌",
    duration: "El más lento",
    comfort: "baja",
    cost: "€",
    description: "La opción más económica, aunque más lenta.",
    actions: [
      {
        label: "Ver rutas en Rome2Rio",
        url: (p) => `https://www.rome2rio.com/es/s/${encodeURIComponent(p.origin)}/${encodeURIComponent(p.destination)}`,
      },
      {
        label: "Ver opciones en Omio",
        url: () => "https://www.omio.es/",
      },
    ],
  },
  {
    id: "coche",
    name: "Coche",
    icon: "🚗",
    duration: "Intermedio",
    comfort: "alta",
    cost: "€€€",
    description: "Flexibilidad total, ideal para grupos o con equipaje.",
    actions: [
      {
        label: "Ver rutas en Google Maps",
        url: (p) => `https://www.google.com/maps/dir/${encodeURIComponent(p.origin)}/${encodeURIComponent(p.destination)}`,
      },
      {
        label: "Ver opciones en Rome2Rio",
        url: (p) => `https://www.rome2rio.com/es/s/${encodeURIComponent(p.origin)}/${encodeURIComponent(p.destination)}`,
      },
    ],
  },
];

function Transport() {
  const { id } = useParams();
  const { grupo, tramoActivo } = useGroup();
  const [userEmail, setUserEmail] = useState("");

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (u) setUserEmail(u.email ?? "");
    });
    return () => unsubAuth();
  }, []);

  // Initialise destination and dates from active tramo (or group root)
  useEffect(() => {
    const dest = tramoActivo?.destination ?? grupo?.destination ?? "";
    const d1 = toISODate(tramoActivo?.startDate ?? grupo?.startDate);
    const d2 = toISODate(tramoActivo?.endDate ?? grupo?.endDate);

    setDestination((prev) => (prev ? prev : dest));
    setDepartDate((prev) => (prev ? prev : d1));
    setReturnDate((prev) => (prev ? prev : d2));
  }, [tramoActivo?.id, grupo?.id]);

  const normalized = useMemo(() => {
    const o = origin.trim();
    const d = destination.trim();
    const dep = departDate.trim();
    const ret = returnDate.trim();
    return {
      o,
      d,
      dep: isValidISODate(dep) ? dep : "",
      ret: isValidISODate(ret) ? ret : "",
    };
  }, [origin, destination, departDate, returnDate]);

  const hasRequiredData = !!normalized.o && !!normalized.d;

  if (!grupo) {
    return (
      <div className="ts-loading-block">
        <span className="ts-spinner" />
        Cargando transporte...
      </div>
    );
  }

  return (
    <div className="transport-page">
      <div className="transport-header">
        <h1 className="transport-title">Transporte</h1>
        <p className="transport-subtitle">Organiza los medios de transporte del viaje</p>
      </div>

      <div className="context-section">
        <h5 className="context-title">Contexto del viaje</h5>

        <div className="context-grid">
          <div className="context-control">
            <label className="context-label">Origen (editable)</label>
            <input
              className="context-input"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej: Madrid"
            />
          </div>

          <div className="context-control">
            <label className="context-label">Destino</label>
            <input
              className="context-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: Sevilla"
              required
            />
            <div className="context-hint">
              Se rellena por defecto con el destino del viaje.
            </div>
          </div>

          <div className="context-control">
            <label className="context-label">Fecha de ida</label>
            <input
              type="date"
              className="context-input"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>

          <div className="context-control">
            <label className="context-label">Fecha de vuelta</label>
            <input
              type="date"
              className="context-input"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        <div className="context-info">
          <small className="context-info-text">
            <strong className="context-info-strong">Nota:</strong> Las opciones mostradas son orientativas. Los precios finales se consultan en plataformas externas.
          </small>
        </div>
      </div>

      <AITransportPanel
        groupId={id!}
        destination={normalized.d}
        originCity={normalized.o}
        dates={[normalized.dep, normalized.ret].filter(Boolean).join(" → ")}
        participantCount={(grupo.invitados?.length ?? 0) + 1}
        userEmail={userEmail}
      />

      <div className="comparison-section">
        <h5 className="comparison-title">Comparativa de medios de transporte</h5>

        <div className="comparison-grid">
          {transportOptions.map((option) => (
            <div key={option.id} className="transport-card">
              <div className="mb-3">
                <span className="transport-icon">{option.icon}</span>
              </div>

              <h6 className="transport-name">{option.name}</h6>

              <div className="transport-details">
                <div className="detail-row">
                  <span className="detail-label">Duración:</span>
                  <span className="detail-value">{option.duration}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Comodidad:</span>
                  <span className={`badge-comfort ${option.comfort}`}>{option.comfort}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Coste estimado:</span>
                  <span className="detail-value">{option.cost}</span>
                </div>
                <p className="transport-description">{option.description}</p>
              </div>

              <div className="transport-actions">
                {option.actions.map((action, index) => (
                  <a
                    key={index}
                    className={`action-btn ${!hasRequiredData ? 'disabled' : ''}`}
                    href={hasRequiredData ? action.url({
                      origin: normalized.o,
                      destination: normalized.d,
                      departDate: normalized.dep,
                      returnDate: normalized.ret,
                    }) : undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!hasRequiredData) {
                        e.preventDefault();
                        alert('Introduce origen y destino para buscar precios y rutas.');
                      }
                    }}
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Transport;
