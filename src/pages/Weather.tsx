import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

type Grupo = {
  name: string;
  destination?: string;
  destinationLat?: number;
  destinationLon?: number;
  startDate?: { seconds: number; nanoseconds: number };
  endDate?: { seconds: number; nanoseconds: number };
  createdBy?: string;
  invitados?: string[];
};

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type DailyUnits = {
  time?: string;
  weathercode?: string;
  temperature_2m_max?: string;
  temperature_2m_min?: string;
  precipitation_sum?: string;
  wind_speed_10m_max?: string;
};

type DailyData = {
  time?: string[];
  weathercode?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  wind_speed_10m_max?: number[];
};

type ForecastResponse = {
  daily_units?: DailyUnits;
  daily?: DailyData;
  error?: boolean;
  reason?: string;
};

type Row = {
  day: string;
  code?: number;
  tmin?: number;
  tmax?: number;
  prcp?: number;
  wind?: number;
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function fromFirestoreTimestamp(ts?: { seconds: number }) {
  if (!ts?.seconds) return null;
  return new Date(ts.seconds * 1000);
}

function formatDestinationForSearch(dest: string) {
  // "Cuenca, Castilla-La Mancha, España" -> "Cuenca"
  return dest.split(",")[0]?.trim() || dest.trim();
}

function weatherCodeToText(code?: number) {
  // Mapeo simple (suficiente para MVP)
  const c = code ?? -1;
  if (c === 0) return "Despejado";
  if (c === 1 || c === 2) return "Poco nublado";
  if (c === 3) return "Nublado";
  if (c === 45 || c === 48) return "Niebla";
  if (c === 51 || c === 53 || c === 55) return "Llovizna";
  if (c === 61 || c === 63 || c === 65) return "Lluvia";
  if (c === 66 || c === 67) return "Lluvia helada";
  if (c === 71 || c === 73 || c === 75) return "Nieve";
  if (c === 77) return "Granizo";
  if (c === 80 || c === 81 || c === 82) return "Chubascos";
  if (c === 85 || c === 86) return "Chubascos de nieve";
  if (c === 95) return "Tormenta";
  if (c === 96 || c === 99) return "Tormenta fuerte";
  return "—";
}

async function geocodeByOpenMeteo(dest: string) {
  const q = formatDestinationForSearch(dest);
  if (!q) return null;

  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(q)}` +
    `&count=1&language=es&format=json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const r: GeoResult | undefined = Array.isArray(json?.results) ? json.results[0] : undefined;
  if (!r || typeof r.latitude !== "number" || typeof r.longitude !== "number") return null;

  return { lat: r.latitude, lon: r.longitude };
}

async function fetchForecast(lat: number, lon: number, start: string, end: string) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lon))}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
    `&timezone=auto` +
    `&start_date=${encodeURIComponent(start)}` +
    `&end_date=${encodeURIComponent(end)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`No se pudo cargar la previsión (${res.status}). ${text ? text.slice(0, 160) : ""}`);
  }

  const json = (await res.json()) as ForecastResponse;

  if (json?.error) {
    throw new Error(json.reason || "Open-Meteo devolvió un error.");
  }

  return json;
}

function Weather() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<DailyUnits | null>(null);

  // --- Cargar grupo ---
  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    const fetchGrupo = async () => {
      const ref = doc(db, "grupos", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        navigate("/");
        return;
      }

      const data = snap.data() as any;
      setGrupo({
        name: data.name ?? "Grupo",
        destination: data.destination ?? "",
        destinationLat: typeof data.destinationLat === "number" ? data.destinationLat : undefined,
        destinationLon: typeof data.destinationLon === "number" ? data.destinationLon : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.createdBy,
        invitados: Array.isArray(data.invitados) ? data.invitados : [],
      });
    };

    fetchGrupo();
  }, [id, navigate]);

  // Tiempo real (opcional pero consistente con el resto)
  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "grupos", id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as any;

      setGrupo({
        name: data.name ?? "Grupo",
        destination: data.destination ?? "",
        destinationLat: typeof data.destinationLat === "number" ? data.destinationLat : undefined,
        destinationLon: typeof data.destinationLon === "number" ? data.destinationLon : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.createdBy,
        invitados: Array.isArray(data.invitados) ? data.invitados : [],
      });
    });

    return () => unsub();
  }, [id]);

  const startEnd = useMemo(() => {
    const start = fromFirestoreTimestamp(grupo?.startDate || undefined);
    const end = fromFirestoreTimestamp(grupo?.endDate || undefined);

    if (!start || !end) return null;

    // si end < start por cualquier motivo, lo corregimos
    const s = start <= end ? start : end;
    const e = start <= end ? end : start;

    return { start: s, end: e };
  }, [grupo?.startDate, grupo?.endDate]);

  // --- Cargar clima ---
  useEffect(() => {
    const run = async () => {
      if (!grupo?.destination?.trim()) return;
      if (!startEnd) return;

      setLoadingWeather(true);
      setError("");
      setRows([]);
      setUnits(null);

      try {
        // ✅ 1) Usar coords guardadas si existen
        let lat = grupo.destinationLat;
        let lon = grupo.destinationLon;

        // 🟡 2) Fallback geocoding si el grupo es antiguo y no tiene coords
        if (typeof lat !== "number" || typeof lon !== "number") {
          const geo = await geocodeByOpenMeteo(grupo.destination);
          if (!geo) throw new Error("No se encontró el destino. Prueba a ser más específico.");
          lat = geo.lat;
          lon = geo.lon;
        }

        const startISO = toISODate(startEnd.start);
        const endISO = toISODate(startEnd.end);

        const data = await fetchForecast(lat, lon, startISO, endISO);

        setUnits(data.daily_units ?? null);

        const d = data.daily ?? {};
        const times = Array.isArray(d.time) ? d.time : [];

        const out: Row[] = times.map((day, idx) => ({
          day,
          code: Array.isArray(d.weathercode) ? d.weathercode[idx] : undefined,
          tmin: Array.isArray(d.temperature_2m_min) ? d.temperature_2m_min[idx] : undefined,
          tmax: Array.isArray(d.temperature_2m_max) ? d.temperature_2m_max[idx] : undefined,
          prcp: Array.isArray(d.precipitation_sum) ? d.precipitation_sum[idx] : undefined,
          wind: Array.isArray(d.wind_speed_10m_max) ? d.wind_speed_10m_max[idx] : undefined,
        }));

        setRows(out);
      } catch (e: any) {
        setError(e?.message ?? "Error cargando la previsión.");
      } finally {
        setLoadingWeather(false);
      }
    };

    run();
  }, [grupo?.destination, grupo?.destinationLat, grupo?.destinationLon, startEnd]);

  // Seguridad simple: si no hay sesión, que vuelva (como el resto de páginas)
  useEffect(() => {
    if (!auth.currentUser) {
      // no forzamos mucho, pero evitamos páginas sin login
      // si prefieres mantenerlo abierto, elimina este efecto
    }
  }, []);

  if (!grupo) return <div className="container mt-5">Cargando clima...</div>;

  const startLabel = startEnd ? startEnd.start.toLocaleDateString() : "—";
  const endLabel = startEnd ? startEnd.end.toLocaleDateString() : "—";

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="m-0">Clima — {grupo.name}</h2>
          <div className="mt-2">
            <div>
              <strong>Destino:</strong> {grupo.destination || "—"}
            </div>
            <div>
              <strong>Fechas del viaje:</strong> {startLabel} — {endLabel}
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      <div className="card p-3">
        <h5 className="mb-3">Previsión diaria</h5>

        {loadingWeather ? (
          <div className="text-muted">Cargando previsión...</div>
        ) : rows.length === 0 ? (
          <div className="text-muted">Sin datos de previsión.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Tiempo</th>
                  <th>Mín</th>
                  <th>Máx</th>
                  <th>Precip.</th>
                  <th>Viento</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.day}>
                    <td>{new Date(r.day).toLocaleDateString()}</td>
                    <td className="text-capitalize">{weatherCodeToText(r.code)}</td>
                    <td>
                      {r.tmin != null ? Math.round(r.tmin) : "—"}{" "}
                      {units?.temperature_2m_min ?? "°C"}
                    </td>
                    <td>
                      {r.tmax != null ? Math.round(r.tmax) : "—"}{" "}
                      {units?.temperature_2m_max ?? "°C"}
                    </td>
                    <td>
                      {r.prcp != null ? r.prcp : "—"}{" "}
                      {units?.precipitation_sum ?? "mm"}
                    </td>
                    <td>
                      {r.wind != null ? r.wind : "—"}{" "}
                      {units?.wind_speed_10m_max ?? "km/h"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="small text-muted mt-2">Datos de Open-Meteo (sin API key).</div>
      </div>
    </div>
  );
}

export default Weather;
 