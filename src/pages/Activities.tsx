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
  destinationLat?: number;
  destinationLon?: number;
  invitados: string[];
  activities: Activity[];
  createdBy: string; 
};

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type Poi = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
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

  // Sugerencias
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [suggestions, setSuggestions] = useState<Poi[]>([]);
  const [radius, setRadius] = useState(2000);
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
        destinationLat: typeof data.destinationLat === "number" ? data.destinationLat : undefined,
        destinationLon: typeof data.destinationLon === "number" ? data.destinationLon : undefined,
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
        destinationLat: typeof data.destinationLat === "number" ? data.destinationLat : undefined,
        destinationLon: typeof data.destinationLon === "number" ? data.destinationLon : undefined,
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

 

  function formatDestinationForSearch(dest: string) {
    return dest.split(",")[0]?.trim() || dest.trim();
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

  async function getLatLonForGroup() {
    const dest = grupo?.destination?.trim() || "";


    if (
      typeof grupo?.destinationLat === "number" &&
      typeof grupo?.destinationLon === "number"
    ) {
      return { lat: grupo.destinationLat, lon: grupo.destinationLon };
    }

    // 🟡 Fallback: geocoding para grupos antiguos
    const geo = await geocodeByOpenMeteo(dest);
    return geo;
  }

  function buildGoogleMapsLink(lat: number, lon: number, name?: string) {
    const q = name ? encodeURIComponent(name) : `${lat},${lon}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  async function fetchOverpassPois(lat: number, lon: number) {
    
    const query = `
      [out:json][timeout:25];
      (
        node(around:${radius},${lat},${lon})["tourism"];
        node(around:${radius},${lat},${lon})["amenity"="restaurant"];
        node(around:${radius},${lat},${lon})["amenity"="cafe"];
        node(around:${radius},${lat},${lon})["amenity"="bar"];
        node(around:${radius},${lat},${lon})["leisure"="park"];
        node(around:${radius},${lat},${lon})["historic"];
        node(around:${radius},${lat},${lon})["man_made"="tower"];
        node(around:${radius},${lat},${lon})["natural"="peak"];
        node(around:${radius},${lat},${lon})["viewpoint"];
      );
      out body ${Math.max(10, Math.min(limit, 50))};
    `.trim();

    const url = `https://overpass-api.de/api/interpreter`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Overpass falló (${res.status}). ${text ? text.slice(0, 180) : ""}`);
    }

    const json = await res.json();

    const elements = Array.isArray(json?.elements) ? json.elements : [];
    const pois: Poi[] = elements
      .map((el: any) => {
        const tags = el?.tags ?? {};
        const name = (tags.name || "").trim();
        if (!name) return null;

        const type =
          tags.tourism ||
          tags.amenity ||
          tags.historic ||
          tags.leisure ||
          tags.natural ||
          tags.man_made ||
          (tags.viewpoint ? "viewpoint" : "place");

        return {
          id: String(el.id),
          name,
          type: String(type),
          lat: Number(el.lat),
          lon: Number(el.lon),
          website: typeof tags.website === "string" ? tags.website : undefined,
          wikipedia: typeof tags.wikipedia === "string" ? tags.wikipedia : undefined,
        } as Poi;
      })
      .filter(Boolean);

    
    const unique = Array.from(
      new Map(pois.map((p) => [`${p.name}-${p.lat}-${p.lon}`, p])).values()
    );

    return unique.slice(0, Math.max(5, Math.min(limit, 50)));
  }

  const handleSuggest = async () => {
    setSuggestLoading(true);
    setSuggestError("");
    setSuggestions([]);

    try {
      if (!grupo?.destination?.trim()) {
        throw new Error("Este grupo no tiene destino definido.");
      }

      const coords = await getLatLonForGroup();
      if (!coords) {
        throw new Error("No se encontró el destino. Prueba con un nombre más específico.");
      }

      const pois = await fetchOverpassPois(coords.lat, coords.lon);
      if (!pois.length) {
        throw new Error("No se encontraron lugares cercanos con ese radio. Prueba aumentando el radio.");
      }

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

    const mapsUrl = buildGoogleMapsLink(poi.lat, poi.lon, poi.name);

    const descParts = [
      `Tipo: ${poi.type}`,
      poi.website ? `Web: ${poi.website}` : "",
      poi.wikipedia ? `Wikipedia: ${poi.wikipedia}` : "",
      `Google Maps: ${mapsUrl}`,
    ].filter(Boolean);

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: poi.name.trim(),
      description: descParts.join(" · "),
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

      {}
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
            <ul className="list-group">
              {suggestions.map((p) => {
                const mapsUrl = buildGoogleMapsLink(p.lat, p.lon, p.name);
                return (
                  <li key={p.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div style={{ flex: 1 }}>
                        <strong>{p.name}</strong>
                        <div className="small text-muted">Tipo: {p.type}</div>

                        <div className="small mt-1">
                          <a href={mapsUrl} target="_blank" rel="noreferrer">
                            Ver en Google Maps
                          </a>
                        </div>

                        {p.website && (
                          <div className="small">
                            <a href={p.website} target="_blank" rel="noreferrer">
                              Web
                            </a>
                          </div>
                        )}

                        {p.wikipedia && <div className="small text-muted">Wikipedia: {p.wikipedia}</div>}
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
          <div className="text-muted small mt-3">Pulsa “Buscar sugerencias” para ver propuestas.</div>
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

       
            const mapsMatch = a.description?.match(/Google Maps:\s*(https?:\/\/\S+)/i);
            const mapsLink = mapsMatch?.[1];

            return (
              <li key={a.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2">
                      <strong>{a.title}</strong>
                      <span className="badge text-bg-secondary">{votesCount} votos</span>
                    </div>

                    {a.location && <div className="small">📍 {a.location}</div>}
                    {a.date && <div className="small">📅 {new Date(a.date).toLocaleDateString()}</div>}
                    {a.description && <div className="mt-2">{a.description}</div>}

                    {mapsLink && (
                      <div className="small mt-2">
                        <a href={mapsLink} target="_blank" rel="noreferrer">
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