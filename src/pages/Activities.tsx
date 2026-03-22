import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useGroup } from "../contexts/GroupContext";
import "../styles/activities.css";
import AISuggestionsPanel from "../components/AISuggestionsPanel";

type Activity = {
  id: string;
  title: string;
  description: string;
  date?: string;
  location?: string;
  createdBy: string;
  createdAt: string;
  votes: string[];
  itineraryItemId?: string;
};


type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
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

type CategoryFilter = {
  label: string;
  key: string;
  checked: boolean;
};

// Modal para añadir al itinerario
function ItineraryModal({
  show,
  onClose,
  onConfirm,
  activity,
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  maxDate,
  dateError,
}: {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activity: Activity | null;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  minDate?: string;
  maxDate?: string;
  dateError?: string;
}) {
  if (!show || !activity) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "1rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h5 style={{ margin: 0, fontSize: "1.25rem" }}>Añadir al itinerario</h5>
          <button className="btn-close" onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" }}>×</button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <strong>Actividad:</strong> {activity.title}
          </div>
          <div className="mb-3">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className={`form-control${dateError ? " is-invalid" : ""}`}
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              min={minDate}
              max={maxDate}
            />
            {dateError && <div className="invalid-feedback" style={{ display: "block" }}>{dateError}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Hora (opcional)</label>
            <input type="time" className="form-control" value={time} onChange={(e) => onTimeChange(e.target.value)} />
          </div>
        </div>
        <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onConfirm}>Añadir al itinerario</button>
        </div>
      </div>
    </div>
  );
}

function Activities() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { grupo, tramoActivo } = useGroup();

  const [activities, setActivities] = useState<Activity[]>([]);

  // Form manual
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  // Sugerencias OSM
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [suggestions, setSuggestions] = useState<Poi[]>([]);
  const [radius, setRadius] = useState(2000);
  const [limit, setLimit] = useState(20);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Modal itinerario
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [itineraryDate, setItineraryDate] = useState("");
  const [itineraryDateError, setItineraryDateError] = useState("");
  const [itineraryTime, setItineraryTime] = useState("");

  // Filtros de categorías
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([
    { label: "Museos, turismo, monumentos", key: "museos", checked: true },
    { label: "Parques, zoológicos", key: "parques", checked: false },
    { label: "Miradores, miradores", key: "miradores", checked: false },
    { label: "Restaurantes", key: "restaurantes", checked: false },
    { label: "Cafeterías", key: "cafeterias", checked: false },
    { label: "Bares", key: "bares", checked: false },
  ]);

  const userEmail = auth.currentUser?.email ?? null;
  const userUid = auth.currentUser?.uid ?? null;

  const tripMinDate = tramoActivo?.startDate
    ? new Date(tramoActivo.startDate.seconds * 1000).toISOString().split("T")[0]
    : grupo?.startDate
    ? new Date(grupo.startDate.seconds * 1000).toISOString().split("T")[0]
    : undefined;

  const tripMaxDate = tramoActivo?.endDate
    ? new Date(tramoActivo.endDate.seconds * 1000).toISOString().split("T")[0]
    : grupo?.endDate
    ? new Date(grupo.endDate.seconds * 1000).toISOString().split("T")[0]
    : undefined;

  // Subscribe to activities subcollection for the active tramo
  useEffect(() => {
    if (!id || !tramoActivo?.id) return;

    const q = query(
      collection(db, "grupos", id, "tramos", tramoActivo.id, "actividades"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity)));
    });

    return () => unsub();
  }, [id, tramoActivo?.id]);

  const activitiesSorted = useMemo(() => {
    return activities.slice().sort((a, b) => {
      const va = a.votes?.length ?? 0;
      const vb = b.votes?.length ?? 0;
      if (vb !== va) return vb - va;
      const toMs = (val: unknown): number => {
        if (!val) return 0;
        if (typeof val === "object" && "toMillis" in (val as object))
          return (val as { toMillis: () => number }).toMillis();
        if (typeof val === "string") return new Date(val).getTime();
        return 0;
      };
      return toMs(b.createdAt) - toMs(a.createdAt);
    });
  }, [activities]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !tramoActivo?.id) return;

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

    await addDoc(collection(db, "grupos", id, "tramos", tramoActivo.id, "actividades"), {
      title: title.trim(),
      description: description.trim(),
      date: date ? new Date(date).toISOString() : null,
      location: location.trim() || null,
      createdBy: email,
      createdAt: new Date().toISOString(),
      votes: [],
    });

    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
  };

  const handleToggleVote = async (activityId: string) => {
    if (!id || !tramoActivo?.id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para votar.");
      navigate("/login");
      return;
    }

    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const hasVoted = (activity.votes ?? []).includes(email);
    const actRef = doc(db, "grupos", id, "tramos", tramoActivo.id, "actividades", activityId);

    await updateDoc(actRef, {
      votes: hasVoted ? arrayRemove(email) : arrayUnion(email),
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!id || !tramoActivo?.id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para borrar actividades.");
      navigate("/login");
      return;
    }

    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const isGroupOwner = userUid && grupo?.createdBy && userUid === grupo.createdBy;
    const isAuthor = activity.createdBy === email;

    if (!isGroupOwner && !isAuthor) {
      alert("Solo el creador del grupo o el autor puede borrar esta actividad.");
      return;
    }

    const ok = confirm("¿Seguro que quieres borrar esta actividad?");
    if (!ok) return;

    // Delete linked itinerary item if exists
    if (activity.itineraryItemId) {
      await deleteDoc(
        doc(db, "grupos", id, "tramos", tramoActivo.id, "itinerario", activity.itineraryItemId)
      ).catch(() => {});
    }

    await deleteDoc(doc(db, "grupos", id, "tramos", tramoActivo.id, "actividades", activityId));
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

  async function getLatLon() {
    const dest = (tramoActivo?.destination ?? grupo?.destination ?? "").trim();
    if (!dest) return null;
    return geocodeByOpenMeteo(dest);
  }

  function buildGoogleMapsLink(lat: number, lon: number, name?: string) {
    const q = name ? encodeURIComponent(name) : `${lat},${lon}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  async function fetchOverpassPois(lat: number, lon: number) {
    const museosChecked = categoryFilters.find((f) => f.key === "museos")?.checked || false;
    const parquesChecked = categoryFilters.find((f) => f.key === "parques")?.checked || false;
    const miradoresChecked = categoryFilters.find((f) => f.key === "miradores")?.checked || false;
    const restaurantesChecked = categoryFilters.find((f) => f.key === "restaurantes")?.checked || false;
    const cafeteriasChecked = categoryFilters.find((f) => f.key === "cafeterias")?.checked || false;
    const baresChecked = categoryFilters.find((f) => f.key === "bares")?.checked || false;

    const anyChecked = museosChecked || parquesChecked || miradoresChecked || restaurantesChecked || cafeteriasChecked || baresChecked;
    const useMuseos = museosChecked || !anyChecked;
    const useParques = parquesChecked;
    const useMiradores = miradoresChecked;
    const useRestaurantes = restaurantesChecked;
    const useCafeterias = cafeteriasChecked;
    const useBares = baresChecked;

    let queryStr = `[out:json][timeout:25];\n(\n`;

    if (useMuseos) {
      queryStr += `  node(around:${radius},${lat},${lon})["tourism"];\n`;
      queryStr += `  node(around:${radius},${lat},${lon})["historic"];\n`;
    }
    if (useParques) {
      queryStr += `  node(around:${radius},${lat},${lon})["leisure"="park"];\n`;
      queryStr += `  node(around:${radius},${lat},${lon})["tourism"="zoo"];\n`;
    }
    if (useMiradores) {
      queryStr += `  node(around:${radius},${lat},${lon})["man_made"="tower"];\n`;
      queryStr += `  node(around:${radius},${lat},${lon})["natural"="peak"];\n`;
      queryStr += `  node(around:${radius},${lat},${lon})["viewpoint"];\n`;
    }
    if (useRestaurantes) queryStr += `  node(around:${radius},${lat},${lon})["amenity"="restaurant"];\n`;
    if (useCafeterias) queryStr += `  node(around:${radius},${lat},${lon})["amenity"="cafe"];\n`;
    if (useBares) queryStr += `  node(around:${radius},${lat},${lon})["amenity"="bar"];\n`;

    queryStr += `);\nout body ${Math.max(10, Math.min(limit, 50))};`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: `data=${encodeURIComponent(queryStr)}`,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Overpass falló (${res.status}). ${text ? text.slice(0, 180) : ""}`);
    }

    const json = await res.json();
    const elements = Array.isArray(json?.elements) ? json.elements : [];

    const pois: Poi[] = elements
      .map((el: Record<string, unknown>) => {
        const tags = (el?.tags ?? {}) as Record<string, string>;
        const name = (tags.name || "").trim();
        if (!name) return null;
        const type = tags.tourism || tags.amenity || tags.historic || tags.leisure || tags.natural || tags.man_made || (tags.viewpoint ? "viewpoint" : "place");
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
      .filter(Boolean) as Poi[];

    const unique = Array.from(new Map(pois.map((p) => [`${p.name}-${p.lat}-${p.lon}`, p])).values());
    return unique.slice(0, Math.max(5, Math.min(limit, 50)));
  }

  const handleSuggest = async () => {
    setSuggestLoading(true);
    setSuggestError("");
    setSuggestions([]);

    try {
      const dest = tramoActivo?.destination ?? grupo?.destination ?? "";
      if (!dest.trim()) throw new Error("Este grupo no tiene destino definido.");

      const coords = await getLatLon();
      if (!coords) throw new Error("No se encontró el destino. Prueba con un nombre más específico.");

      const pois = await fetchOverpassPois(coords.lat, coords.lon);
      if (!pois.length) throw new Error("No se encontraron lugares cercanos con ese radio. Prueba aumentando el radio.");

      setSuggestions(pois);
    } catch (e: unknown) {
      setSuggestError(e instanceof Error ? e.message : "Error buscando sugerencias.");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleAddSuggestion = async (poi: Poi) => {
    if (!id || !tramoActivo?.id) return;

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

    await addDoc(collection(db, "grupos", id, "tramos", tramoActivo.id, "actividades"), {
      title: poi.name.trim(),
      description: descParts.join(" · "),
      date: null,
      location: (tramoActivo?.destination ?? grupo?.destination ?? "").trim() || null,
      createdBy: email,
      createdAt: new Date().toISOString(),
      votes: [],
    });

    setSuggestions((prev) => prev.filter((p) => p.id !== poi.id));
  };

  const handleAddToItinerary = (activity: Activity) => {
    if (!id) return;
    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para añadir actividades al itinerario.");
      navigate("/login");
      return;
    }
    setSelectedActivity(activity);
    setItineraryDate(activity.date ? activity.date.substring(0, 10) : "");
    setItineraryTime("");
    setShowItineraryModal(true);
  };

  const handleConfirmAddToItinerary = async () => {
    if (!id || !tramoActivo?.id || !selectedActivity) return;

    const email = auth.currentUser?.email;
    if (!email) return;

    if (!itineraryDate) {
      setItineraryDateError("Selecciona una fecha para el itinerario.");
      return;
    }
    if (tripMinDate && itineraryDate < tripMinDate) {
      setItineraryDateError(`La fecha debe ser a partir del ${new Date(tripMinDate + "T12:00:00").toLocaleDateString("es-ES")}.`);
      return;
    }
    if (tripMaxDate && itineraryDate > tripMaxDate) {
      setItineraryDateError(`La fecha debe ser antes del ${new Date(tripMaxDate + "T12:00:00").toLocaleDateString("es-ES")}.`);
      return;
    }
    setItineraryDateError("");

    // Add itinerary item to subcollection
    const itemRef = await addDoc(
      collection(db, "grupos", id, "tramos", tramoActivo.id, "itinerario"),
      {
        date: itineraryDate,
        time: itineraryTime || null,
        title: selectedActivity.title,
        notes: selectedActivity.description || null,
        createdBy: email,
        createdAt: new Date().toISOString(),
      }
    );

    // Link itinerary item id back to activity
    await updateDoc(
      doc(db, "grupos", id, "tramos", tramoActivo.id, "actividades", selectedActivity.id),
      { itineraryItemId: itemRef.id }
    );

    setShowItineraryModal(false);
    setSelectedActivity(null);
    setItineraryDate("");
    setItineraryTime("");
  };

  const destination = tramoActivo?.destination ?? grupo?.destination ?? "";

  if (!grupo || !tramoActivo) {
    return (
      <div className="ts-loading-block">
        <span className="ts-spinner" />
        Cargando actividades...
      </div>
    );
  }

  return (
    <div className="activities-page">
      <div className="activities-header">
        <h1 className="activities-title">Actividades</h1>
        <p className="activities-subtitle">Propuestas del grupo. Vota y decide qué hacer durante el viaje.</p>
      </div>

      {userEmail && (
        <AISuggestionsPanel
          groupId={id!}
          tramoId={tramoActivo?.id ?? ""}
          destination={destination}
          userEmail={userEmail}
          participantCount={grupo.invitados?.length ?? 0}
          existingActivities={activities.map((a) => a.title)}
          startDate={tramoActivo?.startDate ?? grupo.startDate}
          endDate={tramoActivo?.endDate ?? grupo.endDate}
        />
      )}

      <form onSubmit={handleAddActivity} className="activities-form-card">
        <div className="mb-3">
          <label className="act-form-label">Título</label>
          <input className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="mb-3">
          <label className="act-form-label">Descripción</label>
          <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="act-form-label">Fecha</label>
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} min={tripMinDate} max={tripMaxDate} />
          </div>
          <div className="col-12 col-md-6">
            <label className="act-form-label">Ubicación</label>
            <input className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: Plaza de España" />
          </div>
        </div>

        <button className="btn-add-activity" type="submit">Añadir actividad</button>
      </form>

      {/* Sugerencias POI */}
      <div className="suggestions-section">
        <div className="suggestions-layout">
          <div className="col-12">
            <h5 className="mb-1">Sugerir actividades</h5>
            <div className="text-muted small mb-2">
              Busca puntos de interés cerca de: <strong>{destination || "—"}</strong>
            </div>
            <div className="text-muted small mb-3">Fuente: OpenStreetMap (Overpass) + enlaces a Google Maps.</div>
          </div>

          <div className="filters-section">
            <div className="filters-grid">
              <div className="filter-card">
                <div className="filter-title">Qué hacer</div>
                <div className="d-flex flex-column gap-2">
                  {["museos", "parques", "miradores"].map((key) => (
                    <div key={key} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={categoryFilters.find((f) => f.key === key)?.checked || false}
                        onChange={(e) => setCategoryFilters((prev) => prev.map((f) => f.key === key ? { ...f, checked: e.target.checked } : f))}
                      />
                      <label className="form-check-label">
                        {key === "museos" ? "Museos, turismo, monumentos" : key === "parques" ? "Parques, zoológicos" : "Miradores, miradores"}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-card">
                <div className="filter-title">Comer</div>
                <div className="d-flex flex-column gap-2">
                  {["restaurantes", "cafeterias", "bares"].map((key) => (
                    <div key={key} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={categoryFilters.find((f) => f.key === key)?.checked || false}
                        onChange={(e) => setCategoryFilters((prev) => prev.map((f) => f.key === key ? { ...f, checked: e.target.checked } : f))}
                      />
                      <label className="form-check-label">
                        {key === "restaurantes" ? "Restaurantes" : key === "cafeterias" ? "Cafeterías" : "Bares"}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="search-controls">
            <div className="search-control">
              <label className="search-label">Radio (m)</label>
              <input type="number" className="search-input" value={radius} min={500} step={500} onChange={(e) => setRadius(Number(e.target.value))} />
            </div>
            <div className="search-control">
              <label className="search-label">Límite</label>
              <input type="number" className="search-input" value={limit} min={5} max={50} step={5} onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
            <div className="search-control">
              <button className="search-btn" type="button" onClick={handleSuggest} disabled={suggestLoading}>
                {suggestLoading ? "Buscando..." : "Buscar sugerencias"}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <button className="btn-suggest-toggle" onClick={() => setShowSuggestions(!showSuggestions)} type="button">
              {showSuggestions ? "↑ Ocultar sugerencias" : "↓ Mostrar sugerencias"}
            </button>
          </div>

          {suggestError && <div className="alert alert-warning mt-3 mb-0">{suggestError}</div>}

          {showSuggestions && !suggestLoading && suggestions.length > 0 && (
            <div className="mt-3">
              <div className="suggestions-grid">
                {suggestions.map((p) => {
                  const mapsUrl = buildGoogleMapsLink(p.lat, p.lon, p.name);
                  return (
                    <div key={p.id} className="suggestion-card">
                      <h6 className="suggestion-title">{p.name}</h6>
                      <p className="suggestion-type">Tipo: {p.type}</p>
                      <div className="suggestion-actions">
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className="suggestion-btn">Ver en Google Maps</a>
                        {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="suggestion-btn">Web</a>}
                        {p.wikipedia && <a href={p.wikipedia} target="_blank" rel="noreferrer" className="suggestion-btn">Wikipedia</a>}
                      </div>
                      <div className="mt-3">
                        <button className="btn btn-success w-100" type="button" onClick={() => handleAddSuggestion(p)}>Añadir actividad</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showSuggestions && !suggestLoading && suggestions.length === 0 && !suggestError && (
            <div className="text-muted small mt-3">Pulsa "Buscar sugerencias" para ver propuestas.</div>
          )}
        </div>
      </div>

      {/* Actividades seleccionadas */}
      <div className="activities-selected-section">
        <div className="activities-selected-header">
          <h2 className="activities-selected-title">Actividades seleccionadas</h2>
          <p className="activities-selected-subtitle">Vota y añade como itinerarios finales las actividades propuestas por los participantes</p>
        </div>

        {activitiesSorted.length === 0 ? (
          <div className="activities-empty">
            <div className="empty-icon">🗺️</div>
            <h5 className="empty-title">Aún no hay actividades propuestas</h5>
            <p className="empty-subtitle">Empieza añadiendo una 👇</p>
          </div>
        ) : (
          <div className="row g-4">
            {activitiesSorted.map((a) => {
              const votesCount = a.votes?.length ?? 0;
              const hasVoted = userEmail ? (a.votes ?? []).includes(userEmail) : false;
              const isInItinerary = !!a.itineraryItemId;

              return (
                <div key={a.id} className="col-12 col-md-6 col-lg-4">
                  <div className="act-card">
                    <div className="act-card-body">
                      <h5 className="act-card-title">{a.title}</h5>

                      {(a.date || a.location) && (
                        <div className="act-card-meta">
                          {a.date && <span className="act-meta-chip">📅 {new Date(a.date).toLocaleDateString()}</span>}
                          {a.location && <span className="act-meta-chip">📍 {a.location}</span>}
                        </div>
                      )}

                      <span className={`act-votes-badge${hasVoted ? " act-votes-badge--voted" : ""}`}>
                        👥 {votesCount} {votesCount === 1 ? "persona apuntada" : "personas apuntadas"}
                      </span>

                      <div className="act-card-footer">
                        <span className="act-proposed-by">Propuesta por {a.createdBy}</span>

                        <div className="act-card-actions">
                          <button
                            className={`act-btn act-btn-vote${hasVoted ? " act-btn-vote--active" : ""}`}
                            onClick={() => handleToggleVote(a.id)}
                            type="button"
                          >
                            {hasVoted ? "Apuntado ✓" : "¡Me apunto!"}
                          </button>

                          {!isInItinerary ? (
                            <button className="act-btn act-btn-outline" onClick={() => handleAddToItinerary(a)} type="button">
                              Añadir al itinerario
                            </button>
                          ) : (
                            <span className="act-in-itinerary-badge">En itinerario ✅</span>
                          )}

                          <button className="act-btn-delete" onClick={() => handleDeleteActivity(a.id)} type="button">
                            Borrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ItineraryModal
        show={showItineraryModal}
        onClose={() => {
          setShowItineraryModal(false);
          setSelectedActivity(null);
          setItineraryDate("");
          setItineraryTime("");
          setItineraryDateError("");
        }}
        onConfirm={handleConfirmAddToItinerary}
        activity={selectedActivity}
        date={itineraryDate}
        time={itineraryTime}
        onDateChange={(v) => { setItineraryDate(v); setItineraryDateError(""); }}
        onTimeChange={setItineraryTime}
        minDate={tripMinDate}
        maxDate={tripMaxDate}
        dateError={itineraryDateError}
      />
    </div>
  );
}

export default Activities;
