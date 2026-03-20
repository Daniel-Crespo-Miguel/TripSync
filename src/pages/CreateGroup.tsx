import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import "../styles/create-group.css";

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

function isValidISODateYYYYMMDD(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

  const [yStr, mStr, dStr] = s.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;

  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function todayYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function searchDestinations(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];

  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(q)}` +
    `&count=8&language=es&format=json`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  const results: GeoResult[] = Array.isArray(json?.results) ? json.results : [];
  return results;
}

function CreateGroup() {
  const [name, setName] = useState("");
  const [destinationInput, setDestinationInput] = useState("");

  const [selectedDestination, setSelectedDestination] = useState<GeoResult | null>(null);
  const [selectedDestinationLabel, setSelectedDestinationLabel] = useState<string>("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [searching, setSearching] = useState(false);
  const [destError, setDestError] = useState("");
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);

  const [formError, setFormError] = useState("");

  const navigate = useNavigate();
  const minDate = useMemo(() => todayYYYYMMDD(), []);

  const formatPlaceLabel = (r: GeoResult) => {
    const parts = [r.name, r.admin1, r.country].filter(Boolean);
    return parts.join(", ");
  };

  useEffect(() => {
    let alive = true;
    const q = destinationInput.trim();

    if (selectedDestination && selectedDestinationLabel && q !== selectedDestinationLabel) {
      setSelectedDestination(null);
      setSelectedDestinationLabel("");
    }

    if (!q) {
      setSuggestions([]);
      setDestError("");
      return;
    }

    if (selectedDestination && q === selectedDestinationLabel) {
      setSuggestions([]);
      setDestError("");
      return;
    }

    const t = setTimeout(async () => {
      setSearching(true);
      setDestError("");

      try {
        const results = await searchDestinations(q);
        if (!alive) return;

        const unique = Array.from(
          new Map(results.map((r) => [`${r.name}-${r.latitude}-${r.longitude}`, r])).values()
        );

        setSuggestions(unique);

        if (unique.length === 0) {
          setDestError("No se encontraron destinos. Prueba con otro nombre (ej: 'Roma', 'Sevilla').");
        }
      } catch {
        if (!alive) return;
        setDestError("No se pudo buscar el destino ahora mismo.");
        setSuggestions([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [destinationInput, selectedDestination, selectedDestinationLabel]);

  const handlePickDestination = (r: GeoResult) => {
    const label = formatPlaceLabel(r);

    setSelectedDestination(r);
    setSelectedDestinationLabel(label);

    setDestinationInput(label);
    setSuggestions([]);
    setDestError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!isValidISODateYYYYMMDD(startDate) || !isValidISODateYYYYMMDD(endDate)) {
      setFormError("Las fechas no son válidas.");
      return;
    }

    if (startDate < minDate) {
      setFormError("La fecha de inicio no puede estar en el pasado.");
      return;
    }

    if (endDate < startDate) {
      setFormError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    if (!selectedDestination) {
      setFormError("Selecciona un destino de la lista de sugerencias.");
      return;
    }

    if (!name.trim()) {
      setFormError("El nombre del grupo es obligatorio.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await addDoc(collection(db, "grupos"), {
        name: name.trim(),
        destination: selectedDestinationLabel || formatPlaceLabel(selectedDestination),
        destinationLat: selectedDestination.latitude,
        destinationLon: selectedDestination.longitude,

        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        createdBy: user.uid,
        createdByEmail: user.email,
        createdAt: Timestamp.now(),
        invitados: [user.email],

        gastos: [],
        activities: [],
        itinerary: [],
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error al crear el grupo:", error);
      setFormError("No se pudo crear el grupo. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="create-group-container">
      <div className="create-group-header">
        <h1 className="create-group-title">Crear nuevo viaje</h1>
        <p className="create-group-subtitle">
          Define los datos básicos del viaje para empezar a organizarlo
        </p>
      </div>

      <div className="create-group-card">
        {formError && <div className="form-error">{formError}</div>}

        <form onSubmit={handleSubmit} className="create-group-form">
          {/* Bloque 1 - Información del viaje */}
          <div className="form-block">
            <div className="form-block-header">
              <h3 className="form-block-title">Información del viaje</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nombre del grupo
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Ej: Viaje a Roma 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="destination" className="form-label">
                Destino
              </label>
              <input
                id="destination"
                type="text"
                className="form-input"
                placeholder="Escribe una ciudad (ej: Roma, Madrid, Lisboa)"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                required
              />
              <div className="form-hint">
                Selecciona un destino de la lista para evitar errores en clima/sugerencias.
              </div>

              {searching && <div className="form-loading">Buscando destinos...</div>}
              {destError && <div className="form-error-small">{destError}</div>}

              {!searching && suggestions.length > 0 && (
                <div className="suggestions-list">
                  {suggestions.map((r) => {
                    const key = `${r.name}-${r.latitude}-${r.longitude}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        className="suggestion-item"
                        onClick={() => handlePickDestination(r)}
                      >
                        {formatPlaceLabel(r)}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedDestination && (
                <div className="destination-selected">
                  Destino seleccionado: <strong>{selectedDestinationLabel}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Separador sutil */}
          <div className="form-divider"></div>

          {/* Bloque 2 - Fechas */}
          <div className="form-block">
            <div className="form-block-header">
              <h3 className="form-block-title">Fechas</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">
                  Fecha de inicio
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={minDate}
                  required
                />
                <div className="form-hint">
                  No se permiten fechas en el pasado.
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="endDate" className="form-label">
                  Fecha de fin
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || minDate}
                  required
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              Crear viaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;
