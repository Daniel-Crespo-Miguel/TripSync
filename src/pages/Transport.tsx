import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

type Grupo = {
  name: string;
  destination?: string;
  startDate?: { seconds: number; nanoseconds: number };
  endDate?: { seconds: number; nanoseconds: number };
};

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
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  // Estados directos (sin lógica de formulario)
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (!u) navigate("/");
    });

    return () => unsubAuth();
  }, [navigate, id]);

  useEffect(() => {
    if (!id) return;

    const ref = doc(db, "grupos", id);

    const fetchOnce = async () => {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        navigate("/");
        return;
      }
      const data = snap.data() as any;
      const g: Grupo = {
        name: data.name ?? "Grupo",
        destination: data.destination ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
      };
      setGrupo(g);

      const d1 = toISODate(g.startDate as any);
      const d2 = toISODate(g.endDate as any);

      // Inicializar estados directos con los datos del grupo
      setDestination(String(g.destination ?? ""));
      setDepartDate(d1);
      setReturnDate(d2);
    };

    fetchOnce();

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;
      const g: Grupo = {
        name: data.name ?? "Grupo",
        destination: data.destination ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
      };
      setGrupo(g);

      const d1 = toISODate(g.startDate as any);
      const d2 = toISODate(g.endDate as any);

      // Actualizar estados directos
      setDestination((prev) => (prev ? prev : String(g.destination ?? "")));
      setDepartDate((prev) => (prev ? prev : d1));
      setReturnDate((prev) => (prev ? prev : d2));
    });

    return () => unsub();
  }, [id, navigate]);

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

  // Validar datos obligatorios para enlaces
  const hasRequiredData = !!normalized.o && !!normalized.d;



  if (!grupo) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Transporte — {grupo.name}</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/grupo/${id}`)}
        >
          Volver al grupo
        </button>
      </div>

      {/* Bloque superior - Contexto del viaje */}
      <div className="card p-4 mb-4">
        <h5 className="mb-3">Contexto del viaje</h5>
        
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">
              Origen (editable)
            </label>
            <input
              className="form-control"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej: Madrid"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Destino</label>
            <input
              className="form-control"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: Sevilla"
              required
            />
            <div className="form-text">
              Se rellena por defecto con el destino del viaje.
            </div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Fecha de ida</label>
            <input
              type="date"
              className="form-control"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Fecha de vuelta</label>
            <input
              type="date"
              className="form-control"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        <div className="alert alert-info mt-3 mb-0">
          <small className="text-muted">
            <strong>Nota:</strong> Las opciones mostradas son orientativas. Los precios finales se consultan en plataformas externas.
          </small>
        </div>
      </div>

      {/* Bloque principal - Comparativa de medios de transporte */}
      <div className="card p-4">
        <h5 className="mb-4">Comparativa de medios de transporte</h5>
        
        <div className="row g-4">
          {transportOptions.map((option) => {
            return (
              <div key={option.id} className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center">
                    <div className="mb-3">
                      <span className="transport-icon" style={{ fontSize: '2.5rem' }}>
                        {option.icon}
                      </span>
                    </div>
                    
                    <h6 className="card-title fw-bold mb-3">{option.name}</h6>
                    
                    <div className="mb-3 text-start">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Duración:</span>
                        <span className="fw-semibold">{option.duration}</span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Comodidad:</span>
                        <span className={`badge ${option.comfort === 'alta' ? 'bg-success' : option.comfort === 'media' ? 'bg-warning' : 'bg-secondary'}`}>
                          {option.comfort}
                        </span>
                      </div>
                      
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Coste estimado:</span>
                        <span className="fw-semibold">{option.cost}</span>
                      </div>
                      
                      <p className="card-text text-muted small">{option.description}</p>
                    </div>

                    <div className="transport-actions">
                      {option.actions.map((action, index) => (
                        <a
                          key={index}
                          className={`btn btn-outline-primary btn-sm w-100 mb-2 ${!hasRequiredData ? 'disabled' : ''}`}
                          href={hasRequiredData ? action.url({
                            origin: normalized.o,
                            destination: normalized.d,
                            departDate: normalized.dep,
                            returnDate: normalized.ret
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Transport;
