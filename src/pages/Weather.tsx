import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

type Group = {
  name: string;
  destination: string;
  startDate?: { seconds: number };
  endDate?: { seconds: number };
  createdBy: string; 
  invitados: string[];
};

type GeoResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string; 
};

type ForecastDaily = {
  time: string[]; 
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  wind_speed_10m_max?: number[];
  weather_code?: number[];
};

type ForecastResponse = {
  timezone?: string;
  daily?: ForecastDaily;
  daily_units?: Record<string, string>;
};

function ymdFromSeconds(seconds: number) {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function weatherCodeToText(code?: number) {
  if (code == null) return "—";
  if (code === 0) return "Despejado";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";
  if (code === 45 || code === 48) return "Niebla";
  if (code === 51 || code === 53 || code === 55) return "Llovizna";
  if (code === 61 || code === 63 || code === 65) return "Lluvia";
  if (code === 71 || code === 73 || code === 75) return "Nieve";
  if (code === 80 || code === 81 || code === 82) return "Chubascos";
  if (code === 95) return "Tormenta";
  return `Código ${code}`;
}

function Weather() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);

  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [daily, setDaily] = useState<ForecastDaily | null>(null);
  const [units, setUnits] = useState<Record<string, string> | null>(null);

  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const run = async () => {
      try {
        if (!id) {
          navigate("/");
          return;
        }

        const snap = await getDoc(doc(db, "grupos", id));
        if (!snap.exists()) {
          navigate("/");
          return;
        }

        const data = snap.data() as any;
        const g: Group = {
          name: data.name ?? "Grupo",
          destination: data.destination ?? "",
          startDate: data.startDate,
          endDate: data.endDate,
          createdBy: data.createdBy ?? "",
          invitados: Array.isArray(data.invitados) ? data.invitados : [],
        };

        const email = user.email ?? "";
        const isMember =
          g.createdBy === user.uid ||
          (Array.isArray(g.invitados) && g.invitados.includes(email));

        if (!isMember) {
          navigate("/");
          return;
        }

        if (!g.destination.trim()) {
          setError("Este grupo no tiene destino definido.");
        }

        setGroup(g);
      } catch (e: any) {
        setError(e?.message ?? "Error cargando el grupo.");
      } finally {
        setLoadingGroup(false);
      }
    };

    run();
  }, [id, navigate]);

  useEffect(() => {
    const run = async () => {
      if (!group?.destination?.trim()) return;

      setLoadingWeather(true);
      setError("");

      try {
        const geoUrl =
          `https://geocoding-api.open-meteo.com/v1/search` +
          `?name=${encodeURIComponent(group.destination)}` +
          `&count=1&language=es&format=json`;

        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("No se pudo buscar el destino (geocoding).");

        const geoJson = await geoRes.json();
        const first: GeoResult | undefined = geoJson?.results?.[0];
        if (!first) throw new Error("No se encontró el destino. Prueba a ser más específico.");

        setGeo(first);

        const start =
          group.startDate?.seconds ? ymdFromSeconds(group.startDate.seconds) : undefined;
        const end =
          group.endDate?.seconds ? ymdFromSeconds(group.endDate.seconds) : undefined;


        const base =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${first.latitude}&longitude=${first.longitude}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code` +
          `&timezone=auto`;

        const range =
          start && end ? `&start_date=${start}&end_date=${end}` : "";

        const forecastUrl = base + range;

        const fRes = await fetch(forecastUrl);
        if (!fRes.ok) throw new Error("No se pudo cargar la previsión.");

        const fJson = (await fRes.json()) as ForecastResponse;

        setDaily(fJson.daily ?? null);
        setUnits(fJson.daily_units ?? null);
      } catch (e: any) {
        setError(e?.message ?? "Error cargando el clima.");
      } finally {
        setLoadingWeather(false);
      }
    };

    run();
  }, [group?.destination, group?.startDate?.seconds, group?.endDate?.seconds]);

  const tripRange = useMemo(() => {
    const s = group?.startDate?.seconds ? ymdFromSeconds(group.startDate.seconds) : null;
    const e = group?.endDate?.seconds ? ymdFromSeconds(group.endDate.seconds) : null;
    return { s, e };
  }, [group?.startDate?.seconds, group?.endDate?.seconds]);

  const rows = useMemo(() => {
    if (!daily?.time?.length) return [];

    return daily.time.map((day, i) => ({
      day,
      tmin: daily.temperature_2m_min?.[i],
      tmax: daily.temperature_2m_max?.[i],
      prcp: daily.precipitation_sum?.[i],
      wind: daily.wind_speed_10m_max?.[i],
      code: daily.weather_code?.[i],
    }));
  }, [daily]);

  if (loadingGroup) return <div className="container mt-5">Cargando...</div>;
  if (!group) return <div className="container mt-5">No se pudo cargar el grupo.</div>;

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Clima — {group.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      <div className="mb-2">
        <div>
          <strong>Destino:</strong> {group.destination}
          {geo && (
            <span className="text-muted">
              {" "}
              ({geo.name}
              {geo.admin1 ? `, ${geo.admin1}` : ""}
              {geo.country ? ` - ${geo.country}` : ""})
            </span>
          )}
        </div>

        {tripRange.s && tripRange.e && (
          <div className="text-muted small">
            Fechas del viaje: {new Date(tripRange.s).toLocaleDateString()} —{" "}
            {new Date(tripRange.e).toLocaleDateString()}
          </div>
        )}
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
                      {r.prcp != null ? r.prcp : "—"} {units?.precipitation_sum ?? "mm"}
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

        <div className="small text-muted mt-2">
          Datos de Open-Meteo (sin API key)
        </div>
      </div>
    </div>
  );
}

export default Weather;
