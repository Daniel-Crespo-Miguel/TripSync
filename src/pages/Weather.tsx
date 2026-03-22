import { useEffect, useMemo, useState } from "react";
import { useGroup } from "../contexts/GroupContext";
import "../styles/weather.css";

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
  return dest.split(",")[0]?.trim() || dest.trim();
}

function weatherCodeToText(code?: number) {
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

function parseAllowedRange(reason?: string) {
  if (!reason) return null;
  const m = reason.match(/from\s(\d{4}-\d{2}-\d{2})\s+to\s(\d{4}-\d{2}-\d{2})/i);
  if (!m) return null;
  return { from: m[1], to: m[2] };
}

function formatISOToES(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
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
  const r = Array.isArray(json?.results) ? json.results[0] : undefined;
  if (!r || typeof r.latitude !== "number" || typeof r.longitude !== "number") return null;

  return { lat: r.latitude as number, lon: r.longitude as number };
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
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    let reason: string | undefined;
    try {
      const maybeJson = JSON.parse(text);
      reason = maybeJson?.reason;
    } catch {
      // not JSON
    }

    const range = parseAllowedRange(reason || text);
    if (range?.to) {
      throw new Error(
        `No hay previsión meteorológica disponible para las fechas seleccionadas. ` +
        `La previsión solo está disponible hasta el ${formatISOToES(range.to)}.`
      );
    }

    throw new Error(`No se pudo cargar la previsión (${res.status}).`);
  }

  const json = (JSON.parse(text) as ForecastResponse) ?? {};

  if (json?.error) {
    const range = parseAllowedRange(json.reason);
    if (range?.to) {
      throw new Error(
        `No hay previsión meteorológica disponible para las fechas seleccionadas. ` +
        `La previsión solo está disponible hasta el ${formatISOToES(range.to)}.`
      );
    }
    throw new Error(json.reason || "Open-Meteo devolvió un error.");
  }

  return json;
}

function Weather() {
  const { grupo, tramoActivo } = useGroup();

  const [loadingWeather, setLoadingWeather] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [units, setUnits] = useState<DailyUnits | null>(null);
  const [showTechnical, setShowTechnical] = useState(false);

  // Use active tramo data when available, fall back to group root
  const destination = tramoActivo?.destination ?? grupo?.destination ?? "";
  const startDateTs = tramoActivo?.startDate ?? grupo?.startDate;
  const endDateTs = tramoActivo?.endDate ?? grupo?.endDate;

  const startEnd = useMemo(() => {
    const start = fromFirestoreTimestamp(startDateTs);
    const end = fromFirestoreTimestamp(endDateTs);
    if (!start || !end) return null;
    const s = start <= end ? start : end;
    const e = start <= end ? end : start;
    return { start: s, end: e };
  }, [startDateTs, endDateTs]);

  useEffect(() => {
    const run = async () => {
      if (!destination.trim()) return;
      if (!startEnd) return;

      setLoadingWeather(true);
      setError("");
      setRows([]);
      setUnits(null);

      try {
        const geo = await geocodeByOpenMeteo(destination);
        if (!geo) throw new Error("No se encontró el destino. Prueba a ser más específico.");

        const startISO = toISODate(startEnd.start);
        const endISO = toISODate(startEnd.end);

        const data = await fetchForecast(geo.lat, geo.lon, startISO, endISO);

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
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error cargando la previsión.");
      } finally {
        setLoadingWeather(false);
      }
    };

    run();
  }, [destination, startEnd]);

  if (!grupo) {
    return (
      <div className="ts-loading-block">
        <span className="ts-spinner" />
        Cargando clima...
      </div>
    );
  }

  const startLabel = startEnd ? startEnd.start.toLocaleDateString() : "—";
  const endLabel = startEnd ? startEnd.end.toLocaleDateString() : "—";

  const tempMin = rows.length > 0 ? Math.min(...rows.map(r => r.tmin ?? Infinity)) : null;
  const tempMax = rows.length > 0 ? Math.max(...rows.map(r => r.tmax ?? -Infinity)) : null;
  const daysWithRain = rows.filter(r => (r.prcp ?? 0) > 0).length;
  const windiestDay = rows.reduce((prev, current) => {
    return (current.wind ?? 0) > (prev.wind ?? 0) ? current : prev;
  }, rows[0] || null);

  const getWeatherIcon = (code?: number) => {
    if (code === 0) return "☀️";
    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code === 51 || code === 53 || code === 55 || code === 61 || code === 63 || code === 65) return "🌧️";
    if (code === 71 || code === 73 || code === 75) return "❄️";
    if (code === 95 || code === 96 || code === 99) return "⛈️";
    return "🌤️";
  };

  const getWeatherIconClass = (code?: number) => {
    if (code === 0) return "weather-icon-sun";
    if (code === 1 || code === 2 || code === 3) return "weather-icon-cloud";
    if (code === 45 || code === 48) return "weather-icon-cloud";
    if (code === 51 || code === 53 || code === 55 || code === 61 || code === 63 || code === 65) return "weather-icon-rain";
    if (code === 71 || code === 73 || code === 75) return "weather-icon-snow";
    if (code === 95 || code === 96 || code === 99) return "weather-icon-storm";
    return "weather-icon-cloud";
  };

  return (
    <div className="weather-page">
      <div className="weather-header">
        <h1 className="weather-title">Clima</h1>
        <p className="weather-subtitle">Previsión meteorológica para tu viaje</p>
      </div>

      <div className="weather-trip-info">
        <div className="trip-info-grid">
          <div className="trip-info-item">
            <span className="trip-info-label">Destino</span>
            <span className="trip-info-value">{destination || "—"}</span>
          </div>
          <div className="trip-info-item">
            <span className="trip-info-label">Fechas del viaje</span>
            <span className="trip-info-value">{startLabel} — {endLabel}</span>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="weather-summary">
          <h2 className="summary-title">Resumen general del viaje</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">🌡️</div>
              <div className="summary-label">Rango térmico</div>
              <div className="summary-value">
                {tempMin != null ? Math.round(tempMin) : "—"}° / {tempMax != null ? Math.round(tempMax) : "—"}°
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🌧️</div>
              <div className="summary-label">Días con lluvia</div>
              <div className="summary-value">{daysWithRain}</div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💨</div>
              <div className="summary-label">Día más ventoso</div>
              <div className="summary-value">
                {windiestDay ? `${Math.round(windiestDay.wind ?? 0)} km/h` : "—"}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📅</div>
              <div className="summary-label">Total de días</div>
              <div className="summary-value">{rows.length}</div>
            </div>
          </div>
        </div>
      )}

      <div className="weather-main">
        <h2 className="forecast-title">Previsión diaria</h2>

        {error && <div className="weather-error">{error}</div>}

        {loadingWeather ? (
          <div className="ts-loading-block">
            <span className="ts-spinner" />
            Cargando previsión...
          </div>
        ) : rows.length === 0 ? (
          <div className="weather-empty">
            <div className="empty-icon">🌤️</div>
            <h5 className="empty-title">Sin datos de previsión</h5>
            <p className="empty-subtitle">No hay datos meteorológicos para las fechas del viaje</p>
          </div>
        ) : (
          <>
            <div className="forecast-grid">
              {rows.map((r) => (
                <div key={r.day} className="forecast-card">
                  <div className="forecast-day">
                    <div className="forecast-date">
                      {new Date(r.day).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                    <div className={`forecast-weather-icon ${getWeatherIconClass(r.code)}`}>
                      {getWeatherIcon(r.code)}
                    </div>
                  </div>

                  <div className="forecast-weather-text">{weatherCodeToText(r.code)}</div>

                  <div className="forecast-temps">
                    <div className="temp-min">{r.tmin != null ? `${Math.round(r.tmin)}°` : "—"}</div>
                    <div className="temp-max">{r.tmax != null ? `${Math.round(r.tmax)}°` : "—"}</div>
                  </div>

                  <div className="forecast-details">
                    <div className="forecast-detail-item">
                      <span>Precip.</span>
                      <span>{r.prcp != null ? `${r.prcp} mm` : "—"}</span>
                    </div>
                    <div className="forecast-detail-item">
                      <span>Viento</span>
                      <span>{r.wind != null ? `${r.wind} km/h` : "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="details-toggle">
              <button
                className="btn-details"
                onClick={() => setShowTechnical(!showTechnical)}
              >
                {showTechnical ? "Ocultar" : "Ver"} detalles técnicos
                <span>{showTechnical ? "↑" : "↓"}</span>
              </button>
            </div>

            <div className={`technical-details ${showTechnical ? 'show' : ''}`}>
              <h3 className="technical-title">Detalles técnicos (Open-Meteo)</h3>
              <div className="technical-grid">
                <div className="technical-card">
                  <div className="technical-label">Unidad de temperatura</div>
                  <div className="technical-value">{units?.temperature_2m_min ?? "°C"}</div>
                </div>
                <div className="technical-card">
                  <div className="technical-label">Unidad de precipitación</div>
                  <div className="technical-value">{units?.precipitation_sum ?? "mm"}</div>
                </div>
                <div className="technical-card">
                  <div className="technical-label">Unidad de viento</div>
                  <div className="technical-value">{units?.wind_speed_10m_max ?? "km/h"}</div>
                </div>
                <div className="technical-card">
                  <div className="technical-label">Fuente de datos</div>
                  <div className="technical-value">Open-Meteo</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="weather-footer">
          Datos proporcionados por Open-Meteo. Sin necesidad de API key.
        </div>
      </div>
    </div>
  );
}

export default Weather;
