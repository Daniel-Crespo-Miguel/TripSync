import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

type Activity = {
  id: string;
  title: string;
  description: string;
  date?: string;
  location?: string;
  createdBy: string;
  createdAt: string;
  votes: string[];
};

type Grupo = {
  name: string;
  destination?: string;
  invitados: string[];
  activities: Activity[];
  createdBy: string; // uid del creador
};

type Poi = {
  id: string; // estable para key
  name: string;
  kind?: string; // categoría simple
  lat?: number;
  lon?: number;
  website?: string;
  wikipedia?: string;
};

function Activities() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  // Form manual
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  // Sugerencias (Open-Meteo geocoding + Overpass OSM)
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Poi[]>([]);
  const [radius, setRadius] = useState(2000); // más estable que 5000
  const [limit, setLimit] = useState(20);

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
        invitados: Array.isArray(data.invitados) ? data.invitados : [],
        activities: Array.isArray(data.activities) ? data.activities : [],
        createdBy: data.createdBy ?? "",
      });
    };

    fetchGrupo();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "grupos", id), (snap) => {
      if (!snap.exists()) return;

      const data = snap.data() as any;
      setGrupo({
        name: data.name ?? "Grupo",
        destination: data.destination ?? "",
        invitados: Array.isArray(data.invitados) ? data.invitados : [],
        activities: Array.isArray(data.activities) ? data.activities : [],
        createdBy: data.createdBy ?? "",
      });
    });

    return () => unsub();
  }, [id]);

  const userEmail = auth.currentUser?.email ?? null;
  const userUid = auth.currentUser?.uid ?? null;

  const activitiesSorted = useMemo(() => {
    const list = grupo?.activities ?? [];
    return list.slice().sort((a, b) => {
      const va = a.votes?.length ?? 0;
      const vb = b.votes?.length ?? 0;
      if (vb !== va) return vb - va;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  }, [grupo?.activities]);

  // -------------------------
  // LINKS (Google Maps / OSM)
  // -------------------------
  function googleMapsUrlFromCoords(lat?: number, lon?: number, label?: string) {
    if (typeof lat === "number" && typeof lon === "number") {
      const q = label ? encodeURIComponent(label) : `${lat},${lon}`;
      return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=`;
    }
    return null;
  }

  function googleMapsUrlFromQuery(query: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  function osmUrlFromCoords(lat?: number, lon?: number, zoom = 16) {
    if (typeof lat === "number" && typeof lon === "number") {
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
    }
    return null;
  }

  // -------------------------
  // CRUD ACTIVITIES (manual)
  // -------------------------
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para crear actividades.");
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      alert("Pon un título.");
      return;
    }

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      date: date ? new Date(date).toISOString() : undefined,
      location: location.trim() || undefined,
      createdBy: email,
      createdAt: new Date().toISOString(),
      votes: [],
    };

    await updateDoc(doc(db, "grupos", id), {
      activities: arrayUnion(newActivity),
    });

    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
  };

  const handleToggleVote = async (activityId: string) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para votar.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const current = grupo.activities ?? [];
    const updated = current.map((a) => {
      if (a.id !== activityId) return a;

      const votes = Array.isArray(a.votes) ? a.votes : [];
      const hasVoted = votes.includes(email);

      return {
        ...a,
        votes: hasVoted ? votes.filter((v) => v !== email) : [...votes, email],
      };
    });

    await updateDoc(doc(db, "grupos", id), {
      activities: updated,
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para borrar actividades.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const activity = (grupo.activities ?? []).find((a) => a.id === activityId);
    if (!activity) return;

    const isGroupOwner = userUid && grupo.createdBy && userUid === grupo.createdBy;
    const isAuthor = activity.createdBy === email;

    if (!isGroupOwner && !isAuthor) {
      alert("Solo el creador del grupo o el autor puede borrar esta actividad.");
      return;
    }

    const ok = confirm("¿Seguro que quieres borrar esta actividad?");
    if (!ok) return;

    const updated = (grupo.activities ?? []).filter((a) => a.id !== activityId);

    await updateDoc(doc(db, "grupos", id), {
      activities: updated,
    });
  };

  // -------------------------
  // SUGERENCIAS: Open-Meteo + Overpass (OSM) con fallback
  // -------------------------
  async function fetchGeoByDestination(dest: string) {
    const url =
      `https://geocoding-api.open-meteo.com/v1/search` +
      `?name=${encodeURIComponent(dest)}` +
      `&count=1&language=es&format=json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("No se pudo geolocalizar el destino (geocoding).");

    const json = await res.json();
    const first = json?.results?.[0];
    if (!first) throw new Error("No se encontró el destino. Prueba con un nombre más específico.");

    return {
      lat: first.latitude as number,
      lon: first.longitude as number,
      name: first.name as string,
    };
  }

  async function fetchPois(lat: number, lon: number) {
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.openstreetmap.ru/api/interpreter",
    ];

    // Query ligera
    const query = `
[out:json][timeout:20];
(
  node(around:${radius},${lat},${lon})["tourism"~"attraction|museum|gallery|viewpoint"];
  way(around:${radius},${lat},${lon})["tourism"~"attraction|museum|gallery|viewpoint"];
  relation(around:${radius},${lat},${lon})["tourism"~"attraction|museum|gallery|viewpoint"];

  node(around:${radius},${lat},${lon})["historic"];
  way(around:${radius},${lat},${lon})["historic"];
  relation(around:${radius},${lat},${lon})["historic"];
);
out center ${limit};
`.trim();

    const fetchWithTimeout = async (url: string, ms: number) => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: query,
          signal: controller.signal,
        });
        return res;
      } finally {
        clearTimeout(t);
      }
    };

    let lastErr = "No se pudo contactar con Overpass.";

    for (const ep of endpoints) {
      try {
        const res = await fetchWithTimeout(ep, 12000);

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          lastErr = `Overpass falló (${res.status}) en ${ep}: ${txt.slice(0, 180)}`;
          if (res.status === 429 || res.status === 504 || res.status === 502) continue;
          throw new Error(lastErr);
        }

        const json = await res.json();
        const elements = Array.isArray(json?.elements) ? json.elements : [];

        const pois: Poi[] = elements
          .map((el: any) => {
            const tags = el.tags ?? {};
            const name = tags.name as string | undefined;
            if (!name) return null;

            const plat = (typeof el.lat === "number" ? el.lat : el?.center?.lat) as
              | number
              | undefined;
            const plon = (typeof el.lon === "number" ? el.lon : el?.center?.lon) as
              | number
              | undefined;

            const kind =
              (tags.tourism as string | undefined) ??
              (tags.historic as string | undefined) ??
              (tags.amenity as string | undefined);

            const website =
              (tags.website as string | undefined) ??
              (tags["contact:website"] as string | undefined);

            const wikipedia = tags.wikipedia as string | undefined;

            return {
              id: `${el.type}-${el.id}`,
              name,
              kind,
              lat: plat,
              lon: plon,
              website,
              wikipedia,
            } as Poi;
          })
          .filter(Boolean) as Poi[];

        const unique = Array.from(new Map(pois.map((p) => [p.id, p])).values());
        return unique.slice(0, limit);
      } catch (e: any) {
        lastErr = e?.message ?? lastErr;
        continue;
      }
    }

    throw new Error(lastErr);
  }

  const handleSuggest = async () => {
    if (!grupo?.destination?.trim()) {
      setSuggestError("Este grupo no tiene destino definido.");
      return;
    }

    setSuggestLoading(true);
    setSuggestError("");
    setSuggestions([]);

    try {
      const { lat, lon } = await fetchGeoByDestination(grupo.destination.trim());
      const pois = await fetchPois(lat, lon);
      setSuggestions(pois);
    } catch (e: any) {
      setSuggestError(e?.message ?? "Error buscando sugerencias.");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleAddSuggestion = async (poi: Poi) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para añadir actividades.");
      navigate("/login");
      return;
    }

    const gmaps = googleMapsUrlFromCoords(poi.lat, poi.lon, poi.name);

    const infoLines = [
      poi.kind ? `Tipo: ${poi.kind}` : "",
      poi.website ? `Web: ${poi.website}` : "",
      poi.wikipedia ? `Wikipedia: ${poi.wikipedia}` : "",
      gmaps ? `Google Maps: ${gmaps}` : "",
    ].filter(Boolean);

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: poi.name.trim(),
      description: infoLines.join("\n"),
      location: grupo?.destination?.trim() || undefined,
      createdBy: email,
      createdAt: new Date().toISOString(),
      votes: [],
    };

    await updateDoc(doc(db, "grupos", id), {
      activities: arrayUnion(newActivity),
    });

    setSuggestions((prev) => prev.filter((p) => p.id !== poi.id));
  };

  if (!grupo) {
    return <div className="container mt-5">Cargando actividades...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Actividades de {grupo.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      <form onSubmit={handleAddActivity} className="card p-3 mb-4">
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Fecha (opcional)</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Ubicación (opcional)</label>
            <input
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Plaza de España"
            />
          </div>
        </div>

        <button className="btn btn-primary" type="submit">
          Añadir actividad
        </button>
      </form>

      {/* --- SUGERENCIAS --- */}
      <div className="card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
          <div>
            <h5 className="mb-1">Sugerir actividades</h5>
            <div className="text-muted small">
              Busca puntos de interés cerca de: <strong>{grupo.destination || "—"}</strong>
            </div>
            <div className="text-muted small">
              Fuente: OpenStreetMap (Overpass) + enlaces a Google Maps.
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            <div>
              <label className="form-label small mb-1">Radio (m)</label>
              <input
                type="number"
                className="form-control"
                style={{ width: 140 }}
                value={radius}
                min={500}
                step={500}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="form-label small mb-1">Límite</label>
              <input
                type="number"
                className="form-control"
                style={{ width: 110 }}
                value={limit}
                min={5}
                max={50}
                step={5}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </div>

            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={handleSuggest}
              disabled={suggestLoading}
            >
              {suggestLoading ? "Buscando..." : "Buscar sugerencias"}
            </button>
          </div>
        </div>

        {suggestError && <div className="alert alert-warning mt-3 mb-0">{suggestError}</div>}

        {!suggestLoading && suggestions.length > 0 && (
          <div className="mt-3">
            <div className="small text-muted mb-2">Resultados (OpenStreetMap).</div>
            <ul className="list-group">
              {suggestions.map((p) => {
                const gmaps = googleMapsUrlFromCoords(p.lat, p.lon, `${p.name} ${grupo.destination ?? ""}`);
                const osm = osmUrlFromCoords(p.lat, p.lon);

                return (
                  <li key={p.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div style={{ flex: 1 }}>
                        <strong>{p.name}</strong>
                        {p.kind && <div className="small text-muted">Tipo: {p.kind}</div>}

                        {(gmaps || osm || p.website || p.wikipedia) && (
                          <div className="small text-muted mt-1">
                            {gmaps && (
                              <>
                                <a href={gmaps} target="_blank" rel="noreferrer">
                                  Ver en Google Maps
                                </a>
                                {" · "}
                              </>
                            )}
                            {osm && (
                              <>
                                <a href={osm} target="_blank" rel="noreferrer">
                                  Ver en OpenStreetMap
                                </a>
                                {" · "}
                              </>
                            )}
                            {p.website && (
                              <>
                                <a href={p.website} target="_blank" rel="noreferrer">
                                  Web
                                </a>
                                {" · "}
                              </>
                            )}
                            {p.wikipedia && (
                              <span>
                                Wikipedia: {p.wikipedia}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        className="btn btn-sm btn-success"
                        type="button"
                        onClick={() => handleAddSuggestion(p)}
                      >
                        Añadir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!suggestLoading && suggestions.length === 0 && !suggestError && (
          <div className="text-muted small mt-3">
            Pulsa “Buscar sugerencias” para ver propuestas.
          </div>
        )}
      </div>

      <h3>Lista de actividades</h3>

      {activitiesSorted.length === 0 ? (
        <p>No hay actividades aún.</p>
      ) : (
        <ul className="list-group">
          {activitiesSorted.map((a) => {
            const votesCount = a.votes?.length ?? 0;
            const hasVoted = userEmail ? (a.votes ?? []).includes(userEmail) : false;

            const canDelete =
              (userUid && grupo.createdBy && userUid === grupo.createdBy) ||
              (userEmail && a.createdBy === userEmail);

            const query = `${a.title} ${a.location || grupo.destination || ""}`.trim();
            const gmaps = query ? googleMapsUrlFromQuery(query) : null;

            return (
              <li key={a.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2">
                      <strong>{a.title}</strong>
                      <span className="badge text-bg-secondary">{votesCount} votos</span>
                    </div>

                    {a.location && <div className="small">📍 {a.location}</div>}
                    {a.date && (
                      <div className="small">📅 {new Date(a.date).toLocaleDateString()}</div>
                    )}

                    {a.description && <div className="mt-2" style={{ whiteSpace: "pre-wrap" }}>{a.description}</div>}

                    {gmaps && (
                      <div className="small text-muted mt-2">
                        <a href={gmaps} target="_blank" rel="noreferrer">
                          Ver en Google Maps
                        </a>
                      </div>
                    )}

                    <div className="small text-muted mt-2">Propuesta por: {a.createdBy}</div>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <button
                      className={`btn ${hasVoted ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => handleToggleVote(a.id)}
                      type="button"
                    >
                      {hasVoted ? "Apuntado ✓" : "¡Me apunto!"}
                    </button>

                    {canDelete && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteActivity(a.id)}
                        type="button"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Activities;
