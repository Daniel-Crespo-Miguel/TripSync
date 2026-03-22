import { useEffect, useRef, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useGroup } from "../contexts/GroupContext";
import "../styles/tramos.css";

type GeoResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

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
  return Array.isArray(json?.results) ? json.results : [];
}

function formatPlaceLabel(r: GeoResult) {
  return [r.name, r.admin1, r.country].filter(Boolean).join(", ");
}

function toISO(seconds: number) {
  const d = new Date(seconds * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDisplay(seconds: number) {
  return new Date(seconds * 1000).toLocaleDateString();
}

function TramoSelector() {
  const { grupo, user, tramos, tramoActivo, setTramoActivo } = useGroup();

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Destination autocomplete
  const [formDest, setFormDest] = useState("");
  const [selectedDest, setSelectedDest] = useState<GeoResult | null>(null);
  const [selectedDestLabel, setSelectedDestLabel] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<GeoResult[]>([]);
  const [destSearching, setDestSearching] = useState(false);
  const [destError, setDestError] = useState("");

  // Dates
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");

  // Form state
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Autocomplete effect
  useEffect(() => {
    let alive = true;
    const q = formDest.trim();

    if (selectedDest && selectedDestLabel && q !== selectedDestLabel) {
      setSelectedDest(null);
      setSelectedDestLabel("");
    }

    if (!q) {
      setDestSuggestions([]);
      setDestError("");
      return;
    }

    if (selectedDest && q === selectedDestLabel) {
      setDestSuggestions([]);
      setDestError("");
      return;
    }

    const t = setTimeout(async () => {
      setDestSearching(true);
      setDestError("");
      try {
        const results = await searchDestinations(q);
        if (!alive) return;
        const unique = Array.from(
          new Map(results.map((r) => [`${r.name}-${r.latitude}-${r.longitude}`, r])).values()
        );
        setDestSuggestions(unique);
        if (unique.length === 0) {
          setDestError("No se encontraron destinos. Prueba con otro nombre.");
        }
      } catch {
        if (!alive) return;
        setDestError("No se pudo buscar el destino ahora mismo.");
        setDestSuggestions([]);
      } finally {
        if (alive) setDestSearching(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [formDest, selectedDest, selectedDestLabel]);

  if (!grupo || !user) return null;

  const isCreator = user.uid === grupo.createdBy;
  if (tramos.length <= 1 && !isCreator) return null;

  const groupStartISO = toISO(grupo.startDate.seconds);
  const groupEndISO = toISO(grupo.endDate.seconds);

  const handlePickDest = (r: GeoResult) => {
    const label = formatPlaceLabel(r);
    setSelectedDest(r);
    setSelectedDestLabel(label);
    setFormDest(label);
    setDestSuggestions([]);
    setDestError("");
  };

  const resetForm = () => {
    setFormDest("");
    setSelectedDest(null);
    setSelectedDestLabel("");
    setDestSuggestions([]);
    setDestError("");
    setFormStart("");
    setFormEnd("");
    setFormError("");
    setFormKey((k) => k + 1);
  };

  const handleAddTramo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedDest) {
      setFormError("Selecciona un destino de la lista de sugerencias.");
      return;
    }
    if (!formStart || !formEnd) {
      setFormError("Completa las fechas de inicio y fin.");
      return;
    }
    if (formStart < groupStartISO) {
      setFormError(`La fecha de inicio no puede ser anterior al comienzo del viaje (${groupStartISO}).`);
      return;
    }
    if (formEnd > groupEndISO) {
      setFormError(`La fecha de fin no puede ser posterior al final del viaje (${groupEndISO}).`);
      return;
    }
    if (formStart >= formEnd) {
      setFormError("La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }

    setSaving(true);
    try {
      const startDate = {
        seconds: Math.floor(new Date(formStart + "T12:00:00").getTime() / 1000),
        nanoseconds: 0,
      };
      const endDate = {
        seconds: Math.floor(new Date(formEnd + "T12:00:00").getTime() / 1000),
        nanoseconds: 0,
      };

      await addDoc(collection(db, "grupos", grupo.id, "tramos"), {
        destination: selectedDestLabel,
        destinationLat: selectedDest.latitude,
        destinationLon: selectedDest.longitude,
        startDate,
        endDate,
        heroImageUrl: null,
        order: tramos.length + 1,
        createdAt: serverTimestamp(),
      });

      resetForm();
      setShowForm(false);
      setOpen(false);
    } catch (err) {
      console.error("Error adding tramo:", err);
      setFormError("Error al guardar el tramo. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tramo-fab-wrapper" ref={fabRef}>
      {open && (
        <div className="tramo-panel">
          <div className="tramo-panel-header">Tramos del viaje</div>

          {tramos.map((tramo, i) => {
            const active = tramoActivo?.id === tramo.id;
            return (
              <button
                key={tramo.id}
                type="button"
                className={`tramo-panel-row${active ? " tramo-panel-row--active" : ""}`}
                onClick={() => { setTramoActivo(tramo); setOpen(false); }}
              >
                <span className={`tramo-panel-pill${active ? " tramo-panel-pill--active" : ""}`}>
                  {i + 1}
                </span>
                <span className="tramo-panel-info">
                  <span className="tramo-panel-dest">{tramo.destination.split(",")[0]}</span>
                  <span className="tramo-panel-dates">
                    {toDisplay(tramo.startDate.seconds)} – {toDisplay(tramo.endDate.seconds)}
                  </span>
                </span>
                {active && <span className="tramo-panel-check">✓</span>}
              </button>
            );
          })}

          {isCreator && (
            <>
              <hr className="tramo-panel-divider" />
              {!showForm ? (
                <button
                  type="button"
                  className="tramo-panel-add"
                  onClick={() => setShowForm(true)}
                >
                  <span className="tramo-panel-add-pill">+</span>
                  Añadir tramo
                </button>
              ) : (
                <form key={formKey} className="tramo-form" onSubmit={handleAddTramo}>
                  <div className="tramo-field">
                    <input
                      className="tramo-input tramo-input--full"
                      placeholder="Destino (ej: Roma, Sevilla...)"
                      value={formDest}
                      onChange={(e) => setFormDest(e.target.value)}
                      autoComplete="off"
                    />
                    {destSearching && (
                      <div className="tramo-dest-searching">Buscando...</div>
                    )}
                    {!destSearching && destSuggestions.length > 0 && (
                      <div className="tramo-suggestions-list">
                        {destSuggestions.map((r) => (
                          <button
                            key={`${r.name}-${r.latitude}-${r.longitude}`}
                            type="button"
                            className="tramo-suggestion-item"
                            onClick={() => handlePickDest(r)}
                          >
                            {formatPlaceLabel(r)}
                          </button>
                        ))}
                      </div>
                    )}
                    {destError && !selectedDest && (
                      <div className="tramo-field-error">{destError}</div>
                    )}
                    {selectedDest && (
                      <div className="tramo-dest-selected">✓ {selectedDestLabel}</div>
                    )}
                  </div>

                  <div className="tramo-form-dates">
                    <input
                      type="date"
                      className="tramo-input"
                      min={groupStartISO}
                      max={groupEndISO}
                      onChange={(e) => { setFormStart(e.target.value); setFormError(""); }}
                      required
                    />
                    <input
                      type="date"
                      className="tramo-input"
                      min={formStart || groupStartISO}
                      max={groupEndISO}
                      onChange={(e) => { setFormEnd(e.target.value); setFormError(""); }}
                      required
                    />
                  </div>

                  {formError && <div className="tramo-form-error">{formError}</div>}

                  <div className="tramo-form-actions">
                    <button className="tramo-save-btn" type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      className="tramo-cancel-btn"
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className={`tramo-fab${open ? " tramo-fab--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tramo-fab-label">Añadir o cambiar tramos</span>
      </button>
    </div>
  );
}

export default TramoSelector;
