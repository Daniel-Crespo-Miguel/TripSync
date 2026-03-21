type GeoResult = {
  latitude: number;
  longitude: number;
};

type DailyData = {
  time?: string[];
  weathercode?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
};

type ForecastResponse = {
  daily?: DailyData;
  error?: boolean;
  reason?: string;
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function geocodeByOpenMeteo(dest: string): Promise<{ lat: number; lon: number } | null> {
  const q = dest.split(",")[0]?.trim();
  if (!q) return null;

  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(q)}&count=1&language=es&format=json`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const r: GeoResult | undefined = Array.isArray(json?.results) ? json.results[0] : undefined;
  if (!r || typeof r.latitude !== "number" || typeof r.longitude !== "number") return null;

  return { lat: r.latitude, lon: r.longitude };
}

async function fetchForecast(
  lat: number,
  lon: number,
  start: string,
  end: string
): Promise<ForecastResponse> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto` +
    `&start_date=${encodeURIComponent(start)}` +
    `&end_date=${encodeURIComponent(end)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);

  const json = (await res.json()) as ForecastResponse;
  if (json?.error) throw new Error(json.reason ?? "Open-Meteo error");

  return json;
}

export async function buildWeatherSummary(
  destination: string,
  startTs: { seconds: number } | null | undefined,
  endTs: { seconds: number } | null | undefined
): Promise<string | undefined> {
  try {
    if (!destination || !startTs || !endTs) return undefined;

    const startDate = new Date(startTs.seconds * 1000);
    const endDate = new Date(endTs.seconds * 1000);

    const geo = await geocodeByOpenMeteo(destination);
    if (!geo) return undefined;

    const data = await fetchForecast(geo.lat, geo.lon, toISODate(startDate), toISODate(endDate));

    const d = data.daily ?? {};
    const times = Array.isArray(d.time) ? d.time : [];
    if (times.length === 0) return undefined;

    const tmaxArr = Array.isArray(d.temperature_2m_max) ? d.temperature_2m_max : [];
    const tminArr = Array.isArray(d.temperature_2m_min) ? d.temperature_2m_min : [];
    const prcpArr = Array.isArray(d.precipitation_sum) ? d.precipitation_sum : [];

    const validTmax = tmaxArr.filter((v): v is number => typeof v === "number");
    const validTmin = tminArr.filter((v): v is number => typeof v === "number");
    const rainyDays = prcpArr.filter((v) => typeof v === "number" && v > 1).length;

    const maxTemp = validTmax.length ? Math.round(Math.max(...validTmax)) : null;
    const minTemp = validTmin.length ? Math.round(Math.min(...validTmin)) : null;

    const city = destination.split(",")[0].trim();
    const startStr = startDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    const endStr = endDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

    let summary = `Clima en ${city} del ${startStr} al ${endStr}`;
    if (minTemp !== null && maxTemp !== null) {
      summary += `: temperaturas entre ${minTemp}°C y ${maxTemp}°C`;
    }
    summary +=
      rainyDays > 0
        ? `, ${rainyDays} día${rainyDays > 1 ? "s" : ""} con lluvia`
        : `, sin lluvia prevista`;

    return summary;
  } catch {
    return undefined;
  }
}
