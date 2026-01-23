import { useEffect, useMemo, useState } from "react";
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

function Transport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

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

  const links = useMemo(() => {
    const { o, d, dep, ret } = normalized;

    const qO = encodeURIComponent(o || "");
    const qD = encodeURIComponent(d || "");
    const qDep = encodeURIComponent(dep || "");
    const qRet = encodeURIComponent(ret || "");

    const googleFlights = (() => {
      if (!d) return "";
      if (o && dep && ret) {
        return `https://www.google.com/travel/flights?q=Flights%20to%20${qD}%20from%20${qO}%20on%20${qDep}%20through%20${qRet}`;
      }
      if (o && dep) {
        return `https://www.google.com/travel/flights?q=Flights%20to%20${qD}%20from%20${qO}%20on%20${qDep}`;
      }
      return `https://www.google.com/travel/flights?q=Flights%20to%20${qD}%20from%20${qO}`;
    })();

    const rome2rio = (() => {
      if (!d) return "";
      if (o) return `https://www.rome2rio.com/es/s/${qO}/${qD}`;
      return `https://www.rome2rio.com/es/s//${qD}`;
    })();

    const omio = (() => {
      if (!d) return "";
      const base = "https://www.omio.es/";
      if (!o) return base;
      return base;
    })();

    const trainline = (() => {
      return "https://www.thetrainline.com/es";
    })();

    const googleMapsDestination = (() => {
      if (!d) return "";
      return `https://www.google.com/maps/search/?api=1&query=${qD}`;
    })();

    return {
      googleFlights,
      rome2rio,
      omio,
      trainline,
      googleMapsDestination,
    };
  }, [normalized]);

  const canSearch = !!normalized.d;

  if (!grupo) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Transporte — {grupo.name}</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/grupo/${id}`)}
        >
          Volver al grupo
        </button>
      </div>

      <div className="card p-3 mb-4">
        <h5 className="mb-3">Buscar opciones de ida y vuelta</h5>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label">
              Origen (ciudad / aeropuerto / estación)
            </label>
            <input
              className="form-control"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej: Madrid"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Destino</label>
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
            <label className="form-label">Fecha de ida</label>
            <input
              type="date"
              className="form-control"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">Fecha de vuelta</label>
            <input
              type="date"
              className="form-control"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        {!canSearch && (
          <div className="alert alert-warning mt-3 mb-0">
            Escribe un destino para generar enlaces.
          </div>
        )}
      </div>

      <div className="card p-3">
        <h5 className="mb-3">Enlaces rápidos</h5>

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="list-group">
              <a
                className={`list-group-item list-group-item-action ${!canSearch ? "disabled" : ""}`}
                href={links.googleFlights || "#"}
                target="_blank"
                rel="noreferrer"
              >
                Google Flights (vuelos)
              </a>

              <a
                className={`list-group-item list-group-item-action ${!canSearch ? "disabled" : ""}`}
                href={links.rome2rio || "#"}
                target="_blank"
                rel="noreferrer"
              >
                Rome2rio (rutas combinadas)
              </a>

              <a
                className="list-group-item list-group-item-action"
                href={links.trainline}
                target="_blank"
                rel="noreferrer"
              >
                Trainline (tren)
              </a>

              <a
                className="list-group-item list-group-item-action"
                href={links.omio}
                target="_blank"
                rel="noreferrer"
              >
                Omio (tren / bus / vuelos)
              </a>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card p-3 h-100">
              <div className="mb-2">
                <strong>Destino actual:</strong>{" "}
                {normalized.d ? normalized.d : "—"}
              </div>

              <div className="mb-2">
                <strong>Fechas:</strong> {normalized.dep ? normalized.dep : "—"}{" "}
                {normalized.ret ? `→ ${normalized.ret}` : ""}
              </div>

              <a
                className={`btn btn-outline-primary ${!canSearch ? "disabled" : ""}`}
                href={links.googleMapsDestination || "#"}
                target="_blank"
                rel="noreferrer"
              >
                Ver destino en Google Maps
              </a>

              <div className="small text-muted mt-3">
                Los resultados se abren en webs externas para ver precios en
                tiempo real.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transport;
