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
  itineraryItemId?: string; // Nuevo campo para enlazar con itinerario
};

type ItineraryItem = {
  id: string;
  date: string; 
  time?: string; 
  title: string;
  notes?: string;
  createdBy: string; 
  createdAt: string; 
};

type Grupo = {
  name: string;
  destination?: string;
  destinationLat?: number;
  destinationLon?: number;
  invitados: string[];
  activities: Activity[];
  itinerary: ItineraryItem[];
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
}: {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activity: Activity | null;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}) {
  if (!show || !activity) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h5 style={{ margin: 0, fontSize: '1.25rem' }}>Añadir al itinerario</h5>
          <button 
            className="btn-close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <strong>Actividad:</strong> {activity.title}
          </div>
          <div className="mb-3">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Hora (opcional)</label>
            <input
              type="time"
              className="form-control"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Añadir al itinerario
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Modal para añadir al itinerario
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [itineraryDate, setItineraryDate] = useState("");
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
        itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
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
        itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
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

    // Si la actividad está en el itinerario, también eliminarla del itinerario
    let updatedItinerary = grupo.itinerary ?? [];
    if (activity.itineraryItemId) {
      updatedItinerary = updatedItinerary.filter((item) => item.id !== activity.itineraryItemId);
    }

    const updatedActivities = (grupo.activities ?? []).filter((a) => a.id !== activityId);

    await updateDoc(doc(db, "grupos", id), {
      activities: updatedActivities,
      itinerary: updatedItinerary,
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
    // Construir la query según los filtros seleccionados
    const museosChecked = categoryFilters.find(f => f.key === "museos")?.checked || false;
    const parquesChecked = categoryFilters.find(f => f.key === "parques")?.checked || false;
    const miradoresChecked = categoryFilters.find(f => f.key === "miradores")?.checked || false;
    const restaurantesChecked = categoryFilters.find(f => f.key === "restaurantes")?.checked || false;
    const cafeteriasChecked = categoryFilters.find(f => f.key === "cafeterias")?.checked || false;
    const baresChecked = categoryFilters.find(f => f.key === "bares")?.checked || false;

    // Si no hay filtros seleccionados, usar los valores por defecto
    const useMuseos = museosChecked || (!museosChecked && !parquesChecked && !miradoresChecked && !restaurantesChecked && !cafeteriasChecked && !baresChecked); // Por defecto "Museos" activado
    const useParques = parquesChecked;
    const useMiradores = miradoresChecked;
    const useRestaurantes = restaurantesChecked;
    const useCafeterias = cafeteriasChecked;
    const useBares = baresChecked;

    let query = `[out:json][timeout:25];\n(\n`;

    if (useMuseos) {
      query += `  node(around:${radius},${lat},${lon})["tourism"];\n`;
      query += `  node(around:${radius},${lat},${lon})["historic"];\n`;
    }

    if (useParques) {
      query += `  node(around:${radius},${lat},${lon})["leisure"="park"];\n`;
      query += `  node(around:${radius},${lat},${lon})["tourism"="zoo"];\n`;
    }

    if (useMiradores) {
      query += `  node(around:${radius},${lat},${lon})["man_made"="tower"];\n`;
      query += `  node(around:${radius},${lat},${lon})["natural"="peak"];\n`;
      query += `  node(around:${radius},${lat},${lon})["viewpoint"];\n`;
    }

    if (useRestaurantes) {
      query += `  node(around:${radius},${lat},${lon})["amenity"="restaurant"];\n`;
    }

    if (useCafeterias) {
      query += `  node(around:${radius},${lat},${lon})["amenity"="cafe"];\n`;
    }

    if (useBares) {
      query += `  node(around:${radius},${lat},${lon})["amenity"="bar"];\n`;
    }

    query += `);\nout body ${Math.max(10, Math.min(limit, 50))};`;

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

  const handleAddToItinerary = (activity: Activity) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para añadir actividades al itinerario.");
      navigate("/login");
      return;
    }

    setSelectedActivity(activity);
    setItineraryDate(activity.date || "");
    setItineraryTime("");
    setShowItineraryModal(true);
  };

  const handleConfirmAddToItinerary = async () => {
    if (!id || !selectedActivity) return;

    const email = auth.currentUser?.email;
    if (!email) return;

    if (!itineraryDate) {
      alert("Selecciona una fecha para el itinerario.");
      return;
    }

    const newItem: ItineraryItem = {
      id: crypto.randomUUID(),
      date: itineraryDate,
      time: itineraryTime || undefined,
      title: selectedActivity.title,
      notes: selectedActivity.description || undefined,
      createdBy: email,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "grupos", id), {
      itinerary: arrayUnion(newItem),
    });

    // Actualizar la actividad con el ID del itinerario
    const updatedActivities = (grupo?.activities || []).map((a) => {
      if (a.id === selectedActivity.id) {
        return { ...a, itineraryItemId: newItem.id };
      }
      return a;
    });

    await updateDoc(doc(db, "grupos", id), {
      activities: updatedActivities,
    });

    setShowItineraryModal(false);
    setSelectedActivity(null);
    setItineraryDate("");
    setItineraryTime("");
  };

  if (!grupo) {
    return <div className="container mt-5">Cargando actividades...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="text-center mb-5">
        <h1 className="m-0">Actividades</h1>
        <p className="text-muted mb-0">Propuestas del grupo. Vota y decide qué hacer durante el viaje.</p>
        <div className="mt-4">
          <button className="btn btn-primary me-2" onClick={() => navigate(`/grupo/${id}`)}>
            Volver al grupo
          </button>
          <button className="btn btn-success" onClick={() => {
            // Scroll to form
            const form = document.querySelector('form');
            form?.scrollIntoView({ behavior: 'smooth' });
          }}>
            + Proponer actividad
          </button>
        </div>
      </div>

      <form onSubmit={handleAddActivity} className="card p-4 mb-5">
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
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Ubicación</label>
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

      {/* Sección de sugerencias con filtros visuales */}
      <div className="card p-4 mb-5">
        <div className="row g-3 mb-3">
          <div className="col-12">
            <h5 className="mb-1">Sugerir actividades</h5>
            <div className="text-muted small mb-2">
              Busca puntos de interés cerca de: <strong>{grupo.destination || "—"}</strong>
            </div>
            <div className="text-muted small mb-3">
              Fuente: OpenStreetMap (Overpass) + enlaces a Google Maps.
            </div>
          </div>

          {/* Filtros de categorías */}
          <div className="col-12">
            <div className="row">
              <div className="col-md-6">
                <div className="card border">
                  <div className="card-header bg-light">
                    <strong>Qué hacer</strong>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-column gap-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={categoryFilters.find(f => f.key === "museos")?.checked || false}
                          onChange={(e) => {
                            setCategoryFilters(prev => prev.map(f => 
                              f.key === "museos" ? { ...f, checked: e.target.checked } : f
                            ));
                          }}
                        />
                        <label className="form-check-label">
                          Museos, turismo, monumentos
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={categoryFilters.find(f => f.key === "parques")?.checked || false}
                          onChange={(e) => {
                            setCategoryFilters(prev => prev.map(f => 
                              f.key === "parques" ? { ...f, checked: e.target.checked } : f
                            ));
                          }}
                        />
                        <label className="form-check-label">
                          Parques, zoológicos
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={categoryFilters.find(f => f.key === "miradores")?.checked || false}
                          onChange={(e) => {
                            setCategoryFilters(prev => prev.map(f => 
                              f.key === "miradores" ? { ...f, checked: e.target.checked } : f
                            ));
                          }}
                        />
                        <label className="form-check-label">
                          Miradores, miradores
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border">
                  <div className="card-header bg-light">
                    <strong>Comer</strong>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-column gap-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={categoryFilters.find(f => f.key === "restaurantes")?.checked || false}
                          onChange={(e) => {
                            setCategoryFilters(prev => prev.map(f => 
                              f.key === "restaurantes" ? { ...f, checked: e.target.checked } : f
                            ));
                          }}
                        />
                        <label className="form-check-label">
                          Restaurantes
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={categoryFilters.find(f => f.key === "cafeterias")?.checked || false}
                          onChange={(e) => {
                            setCategoryFilters(prev => prev.map(f => 
                              f.key === "cafeterias" ? { ...f, checked: e.target.checked } : f
                            ));
                          }}
                        />
                        <label className="form-check-label">
                          Cafeterías
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={categoryFilters.find(f => f.key === "bares")?.checked || false}
                          onChange={(e) => {
                            setCategoryFilters(prev => prev.map(f => 
                              f.key === "bares" ? { ...f, checked: e.target.checked } : f
                            ));
                          }}
                        />
                        <label className="form-check-label">
                          Bares
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de búsqueda */}
          <div className="col-md-3">
            <label className="form-label small mb-1">Radio (m)</label>
            <input
              type="number"
              className="form-control"
              value={radius}
              min={500}
              step={500}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small mb-1">Límite</label>
            <input
              type="number"
              className="form-control"
              value={limit}
              min={5}
              max={50}
              step={5}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>

          <div className="col-md-6 d-flex align-items-end">
            <button
              className="btn btn-primary w-100"
              type="button"
              onClick={handleSuggest}
              disabled={suggestLoading}
            >
              {suggestLoading ? "Buscando..." : "Buscar sugerencias"}
            </button>
          </div>
        </div>

        {/* Botón para ocultar/mostrar sugerencias */}
        <div className="mt-3">
          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => setShowSuggestions(!showSuggestions)}
            type="button"
          >
            {showSuggestions ? "Ocultar sugerencias" : "Mostrar sugerencias"}
          </button>
        </div>

        {suggestError && <div className="alert alert-warning mt-3 mb-0">{suggestError}</div>}

        {showSuggestions && !suggestLoading && suggestions.length > 0 && (
          <div className="mt-3">
            <div className="row g-3">
              {suggestions.map((p) => {
                const mapsUrl = buildGoogleMapsLink(p.lat, p.lon, p.name);
                return (
                  <div key={p.id} className="col-12 col-md-6 col-lg-4">
                    <div className="card h-100 border">
                      <div className="card-body">
                        <h6 className="card-title">{p.name}</h6>
                        <p className="card-text small text-muted mb-2">Tipo: {p.type}</p>
                        
                        <div className="d-flex flex-column gap-2">
                          <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">
                            Ver en Google Maps
                          </a>
                          
                          {p.website && (
                            <a href={p.website} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm">
                              Web
                            </a>
                          )}
                          
                          {p.wikipedia && (
                            <a href={p.wikipedia} target="_blank" rel="noreferrer" className="btn btn-outline-info btn-sm">
                              Wikipedia
                            </a>
                          )}
                        </div>

                        <div className="mt-3">
                          <button
                            className="btn btn-success w-100"
                            type="button"
                            onClick={() => handleAddSuggestion(p)}
                          >
                            Añadir actividad
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showSuggestions && !suggestLoading && suggestions.length === 0 && !suggestError && (
          <div className="text-muted small mt-3">Pulsa “Buscar sugerencias” para ver propuestas.</div>
        )}
      </div>

      <div className="card p-5 mb-5">
        <div className="mb-3">
          <h2 className="h4 mb-1">Actividades seleccionadas</h2>
          <p className="text-muted mb-0">
            Vota y añade como itinerarios finales las actividades propuestas por los participantes
          </p>
        </div>

        {activitiesSorted.length === 0 ? (
          <div className="text-center py-4">
            <h5 className="text-muted">Aún no hay actividades propuestas</h5>
            <p className="text-muted">Empieza añadiendo una 👇</p>
          </div>
        ) : (
          <div className="row g-4">
            {activitiesSorted.map((a) => {
              const votesCount = a.votes?.length ?? 0;
              const hasVoted = userEmail ? (a.votes ?? []).includes(userEmail) : false;
              const isInItinerary = !!a.itineraryItemId;

              const canDelete = true; // Temporalmente permitir que todos los usuarios puedan borrar

         
              const mapsMatch = a.description?.match(/Google Maps:\s*(https?:\/\/\S+)/i);
              const mapsLink = mapsMatch?.[1];

            return (
              <div key={a.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body">
                    <div className="text-center mb-3">
                      <h5 className="card-title mb-2">{a.title}</h5>
                      <div className="d-flex justify-content-center flex-wrap gap-2 mb-2">
                        {a.location && (
                          <span className="badge bg-light text-dark" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                            📍 {a.location}
                          </span>
                        )}
                        {a.date && (
                          <span className="badge bg-light text-dark" style={{ fontSize: '0.85rem' }}>
                            📅 {new Date(a.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="small text-muted mb-2">
                        {a.description?.split(' · ')[0]?.replace(/^Tipo:\s*/, '') || 'No especificado'}
                      </div>
                      <span className="badge bg-primary" style={{ fontSize: '0.85rem', display: 'inline-block', margin: '0 auto' }}>{votesCount} personas apuntadas</span>
                    </div>

                    <div className="small text-muted mb-3 text-center">Propuesta por: {a.createdBy}</div>

                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex gap-2">
                        <button
                          className={`btn ${hasVoted ? "btn-success" : "btn-outline-success"} flex-grow-1`}
                          onClick={() => handleToggleVote(a.id)}
                          type="button"
                        >
                          {hasVoted ? "Apuntado ✓" : "¡Me apunto!"}
                        </button>
                        
                        {!isInItinerary && (
                          <button
                            className="btn btn-outline-primary flex-grow-1"
                            onClick={() => handleAddToItinerary(a)}
                            type="button"
                          >
                            Añadir al itinerario
                          </button>
                        )}
                      </div>

                      {isInItinerary && (
                        <div className="text-center">
                          <span className="badge bg-success">En itinerario ✅</span>
                        </div>
                      )}

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
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Modal para añadir al itinerario */}
      <ItineraryModal
        show={showItineraryModal}
        onClose={() => {
          setShowItineraryModal(false);
          setSelectedActivity(null);
          setItineraryDate("");
          setItineraryTime("");
        }}
        onConfirm={handleConfirmAddToItinerary}
        activity={selectedActivity}
        date={itineraryDate}
        time={itineraryTime}
        onDateChange={setItineraryDate}
        onTimeChange={setItineraryTime}
      />
    </div>
  );
}

export default Activities;