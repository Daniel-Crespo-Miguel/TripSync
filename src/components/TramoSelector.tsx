import { useEffect, useRef, useState } from "react";
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useGroup } from "../contexts/GroupContext";
import { getAITramoSuggestions } from "../services/aiService";
import { AITramoSuggestion } from "../types/ai";
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

function daysBetween(startSec: number, endSec: number): number {
  return Math.max(1, Math.round((endSec - startSec) / 86400));
}

function TramoSelector() {
  const { grupo, user, tramos, tramoActivo, setTramoActivo } = useGroup();

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Add form — destination autocomplete
  const [formDest, setFormDest] = useState("");
  const [selectedDest, setSelectedDest] = useState<GeoResult | null>(null);
  const [selectedDestLabel, setSelectedDestLabel] = useState("");
  const [destSuggestions, setDestSuggestions] = useState<GeoResult[]>([]);
  const [destSearching, setDestSearching] = useState(false);
  const [destError, setDestError] = useState("");

  // Add form — dates & status
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // AI suggestions state
  const [showAIForm, setShowAIForm] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<AITramoSuggestion[]>([]);
  const [aiDays, setAIDays] = useState<Record<number, number>>({});
  const [aiSaving, setAISaving] = useState(false);

  // Edit / delete state
  const [editingTramoId, setEditingTramoId] = useState<string | null>(null);
  const [deletingTramoId, setDeletingTramoId] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  // Edit form — destination autocomplete
  const [editDest, setEditDest] = useState("");
  const [editSelectedDest, setEditSelectedDest] = useState<GeoResult | null>(null);
  const [editSelectedDestLabel, setEditSelectedDestLabel] = useState("");
  const [editDestSuggestions, setEditDestSuggestions] = useState<GeoResult[]>([]);
  const [editDestSearching, setEditDestSearching] = useState(false);
  const [editDestError, setEditDestError] = useState("");

  // Edit form — dates & status
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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

  // Add form autocomplete effect
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

  // Edit form autocomplete effect
  useEffect(() => {
    let alive = true;
    const q = editDest.trim();

    if (editSelectedDest && editSelectedDestLabel && q !== editSelectedDestLabel) {
      setEditSelectedDest(null);
      setEditSelectedDestLabel("");
    }

    if (!q) {
      setEditDestSuggestions([]);
      setEditDestError("");
      return;
    }

    if (editSelectedDest && q === editSelectedDestLabel) {
      setEditDestSuggestions([]);
      setEditDestError("");
      return;
    }

    const t = setTimeout(async () => {
      setEditDestSearching(true);
      setEditDestError("");
      try {
        const results = await searchDestinations(q);
        if (!alive) return;
        const unique = Array.from(
          new Map(results.map((r) => [`${r.name}-${r.latitude}-${r.longitude}`, r])).values()
        );
        setEditDestSuggestions(unique);
        if (unique.length === 0) {
          setEditDestError("No se encontraron destinos. Prueba con otro nombre.");
        }
      } catch {
        if (!alive) return;
        setEditDestError("No se pudo buscar el destino ahora mismo.");
        setEditDestSuggestions([]);
      } finally {
        if (alive) setEditDestSearching(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [editDest, editSelectedDest, editSelectedDestLabel]);

  if (!grupo || !user) return null;

  const isCreator = user.uid === grupo.createdBy;
  if (tramos.length <= 1 && !isCreator) return null;

  const groupStartISO = toISO(grupo.startDate.seconds);
  const groupEndISO = toISO(grupo.endDate.seconds);
  const groupTotalDays = daysBetween(grupo.startDate.seconds, grupo.endDate.seconds);

  // --- Add form handlers ---

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

  // --- AI handlers ---

  const resetAI = () => {
    setShowAIForm(false);
    setAIPrompt("");
    setAIError(null);
    setAISuggestions([]);
    setAIDays({});
  };

  const handleGenerateAI = async () => {
    setAIError(null);
    setAISuggestions([]);
    setAILoading(true);
    try {
      const existingTramos = tramos.map((t) => ({
        destination: t.destination,
        days: daysBetween(t.startDate.seconds, t.endDate.seconds),
        order: t.order,
      }));
      const results = await getAITramoSuggestions({
        destination: grupo.destination ?? "",
        totalDays: groupTotalDays,
        startDate: groupStartISO,
        userPrompt: aiPrompt.trim(),
        existingTramos,
      });
      const filtered = results.filter((s) => s.isNew !== false);
      const newOnly = filtered.length === 0 && results.length > 0 ? results : filtered;
      setAISuggestions(newOnly);
      const initialDays: Record<number, number> = {};
      newOnly.forEach((s, i) => { initialDays[i] = s.days; });
      setAIDays(initialDays);
    } catch {
      setAIError("Error al conectar con la IA. Inténtalo de nuevo.");
    } finally {
      setAILoading(false);
    }
  };

  const handleCreateAITramos = async () => {
    setAISaving(true);
    try {
      const lastEnd = tramos.length > 0
        ? tramos[tramos.length - 1].endDate.seconds
        : grupo.startDate.seconds;

      let cursorSec = lastEnd;
      const maxOrder = tramos.length > 0 ? Math.max(...tramos.map((t) => t.order)) : 0;

      const writes = aiSuggestions.map((s, i) => {
        const days = aiDays[i] ?? s.days;
        const startSec = cursorSec;
        const endSec = startSec + days * 86400;
        cursorSec = endSec;
        return addDoc(collection(db, "grupos", grupo.id, "tramos"), {
          destination: s.destination,
          startDate: { seconds: startSec, nanoseconds: 0 },
          endDate: { seconds: endSec, nanoseconds: 0 },
          heroImageUrl: null,
          order: maxOrder + i + 1,
          createdAt: serverTimestamp(),
        });
      });

      await Promise.all(writes);
      resetAI();
      setOpen(false);
    } catch (err) {
      console.error("Error creating AI tramos:", err);
      setAIError("Error al guardar los tramos. Inténtalo de nuevo.");
    } finally {
      setAISaving(false);
    }
  };

  // --- Edit handlers ---

  const handlePickEditDest = (r: GeoResult) => {
    const label = formatPlaceLabel(r);
    setEditSelectedDest(r);
    setEditSelectedDestLabel(label);
    setEditDest(label);
    setEditDestSuggestions([]);
    setEditDestError("");
  };

  const startEditing = (tramo: typeof tramos[number]) => {
    setEditingTramoId(tramo.id);
    setDeletingTramoId(null);
    setEditDest(tramo.destination);
    setEditSelectedDestLabel(tramo.destination);
    setEditSelectedDest(null);
    setEditDestSuggestions([]);
    setEditDestError("");
    setEditStart(toISO(tramo.startDate.seconds));
    setEditEnd(toISO(tramo.endDate.seconds));
    setEditError("");
  };

  const resetEdit = () => {
    setEditingTramoId(null);
    setEditDest("");
    setEditSelectedDest(null);
    setEditSelectedDestLabel("");
    setEditDestSuggestions([]);
    setEditDestError("");
    setEditStart("");
    setEditEnd("");
    setEditError("");
  };

  const handleSaveEdit = async (tramoId: string, originalTramo: typeof tramos[number]) => {
    setEditError("");

    const destUnchanged = editDest === originalTramo.destination && editSelectedDest === null;
    if (!destUnchanged && !editSelectedDest) {
      setEditError("Selecciona un destino de la lista de sugerencias.");
      return;
    }
    if (!editStart || !editEnd) {
      setEditError("Completa las fechas de inicio y fin.");
      return;
    }
    if (editStart < groupStartISO) {
      setEditError(`La fecha de inicio no puede ser anterior al comienzo del viaje (${groupStartISO}).`);
      return;
    }
    if (editEnd > groupEndISO) {
      setEditError(`La fecha de fin no puede ser posterior al final del viaje (${groupEndISO}).`);
      return;
    }
    if (editStart >= editEnd) {
      setEditError("La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }

    setEditSaving(true);
    try {
      const startDate = { seconds: Math.floor(new Date(editStart + "T12:00:00").getTime() / 1000), nanoseconds: 0 };
      const endDate = { seconds: Math.floor(new Date(editEnd + "T12:00:00").getTime() / 1000), nanoseconds: 0 };

      const updateData: Record<string, unknown> = { startDate, endDate };
      if (editSelectedDest) {
        updateData.destination = editSelectedDestLabel;
        updateData.destinationLat = editSelectedDest.latitude;
        updateData.destinationLon = editSelectedDest.longitude;
      }

      await updateDoc(doc(db, "grupos", grupo.id, "tramos", tramoId), updateData);
      resetEdit();
    } catch (err) {
      console.error("Error updating tramo:", err);
      setEditError("Error al guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setEditSaving(false);
    }
  };

  // --- Delete handler ---

  const handleDeleteTramo = async (tramoId: string) => {
    setDeletingInProgress(true);
    try {
      await deleteDoc(doc(db, "grupos", grupo.id, "tramos", tramoId));

      const remaining = tramos.filter((t) => t.id !== tramoId);
      if (remaining.length === 1) {
        await updateDoc(doc(db, "grupos", grupo.id, "tramos", remaining[0].id), {
          startDate: grupo.startDate,
          endDate: grupo.endDate,
        });
      }

      setDeletingTramoId(null);
      setTramoActivo(remaining[0] ?? null);
    } catch (err) {
      console.error("Error deleting tramo:", err);
    } finally {
      setDeletingInProgress(false);
    }
  };

  return (
    <div className="tramo-fab-wrapper" ref={fabRef}>
      {open && (
        <div className="tramo-panel">
          <div className="tramo-panel-header">Tramos del viaje</div>

          {tramos.map((tramo, i) => {
            const active = tramoActivo?.id === tramo.id;
            const isEditing = editingTramoId === tramo.id;
            const isDeleting = deletingTramoId === tramo.id;

            return (
              <div key={tramo.id}>
                {isEditing ? (
                  <div className="tramo-edit-form">
                    <div className="tramo-field">
                      <input
                        className="tramo-input tramo-input--full"
                        placeholder="Destino (ej: Roma, Sevilla...)"
                        value={editDest}
                        onChange={(e) => setEditDest(e.target.value)}
                        autoComplete="off"
                      />
                      {editDestSearching && (
                        <div className="tramo-dest-searching">Buscando...</div>
                      )}
                      {!editDestSearching && editDestSuggestions.length > 0 && (
                        <div className="tramo-suggestions-list">
                          {editDestSuggestions.map((r) => (
                            <button
                              key={`${r.name}-${r.latitude}-${r.longitude}`}
                              type="button"
                              className="tramo-suggestion-item"
                              onClick={() => handlePickEditDest(r)}
                            >
                              {formatPlaceLabel(r)}
                            </button>
                          ))}
                        </div>
                      )}
                      {editDestError && !editSelectedDest && (
                        <div className="tramo-field-error">{editDestError}</div>
                      )}
                      {editSelectedDest && (
                        <div className="tramo-dest-selected">✓ {editSelectedDestLabel}</div>
                      )}
                    </div>

                    <div className="tramo-form-dates">
                      <input
                        type="date"
                        className="tramo-input"
                        min={groupStartISO}
                        max={groupEndISO}
                        value={editStart}
                        onChange={(e) => { setEditStart(e.target.value); setEditError(""); }}
                      />
                      <input
                        type="date"
                        className="tramo-input"
                        min={editStart || groupStartISO}
                        max={groupEndISO}
                        value={editEnd}
                        onChange={(e) => { setEditEnd(e.target.value); setEditError(""); }}
                      />
                    </div>

                    {editError && <div className="tramo-form-error">{editError}</div>}

                    <div className="tramo-form-actions">
                      <button
                        className="tramo-save-btn"
                        type="button"
                        onClick={() => handleSaveEdit(tramo.id, tramo)}
                        disabled={editSaving}
                      >
                        {editSaving ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        className="tramo-cancel-btn"
                        type="button"
                        onClick={resetEdit}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`tramo-panel-row${active ? " tramo-panel-row--active" : ""}`}>
                    <button
                      type="button"
                      className="tramo-panel-row-main"
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

                    {isCreator && (
                      <div className="tramo-row-actions">
                        <button
                          type="button"
                          className="tramo-row-btn tramo-row-btn--edit"
                          title="Editar tramo"
                          onClick={(e) => { e.stopPropagation(); startEditing(tramo); }}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="tramo-row-btn tramo-row-btn--delete"
                          title={tramos.length <= 1 ? "No puedes eliminar el único tramo" : "Eliminar tramo"}
                          disabled={tramos.length <= 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTramoId(tramo.id);
                            setEditingTramoId(null);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isDeleting && (
                  <div className="tramo-delete-confirm">
                    <span className="tramo-delete-confirm-text">¿Eliminar este tramo?</span>
                    <div className="tramo-delete-confirm-actions">
                      <button
                        type="button"
                        className="tramo-delete-btn"
                        onClick={() => handleDeleteTramo(tramo.id)}
                        disabled={deletingInProgress}
                      >
                        {deletingInProgress ? "Eliminando..." : "Sí, eliminar"}
                      </button>
                      <button
                        type="button"
                        className="tramo-cancel-btn"
                        onClick={() => setDeletingTramoId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isCreator && (
            <>
              <hr className="tramo-panel-divider" />

              {/* Manual add tramo */}
              {!showForm ? (
                <button
                  type="button"
                  className="tramo-panel-add"
                  onClick={() => { setShowForm(true); resetAI(); }}
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

              <hr className="tramo-panel-divider" />

              {/* AI suggestions section */}
              {!showAIForm && aiSuggestions.length === 0 && (
                <button
                  type="button"
                  className="tramo-ai-btn"
                  onClick={() => { setShowAIForm(true); setShowForm(false); resetForm(); }}
                >
                  <span className="tramo-ai-btn-pill">✨</span>
                  Sugerir tramos con IA
                </button>
              )}

              {showAIForm && aiSuggestions.length === 0 && (
                <div className="tramo-ai-form">
                  <span className="tramo-ai-form-label">Describe tu viaje</span>
                  <textarea
                    className="tramo-ai-textarea"
                    rows={3}
                    placeholder="Ej: me gusta la naturaleza, quiero evitar ciudades masificadas..."
                    value={aiPrompt}
                    onChange={(e) => setAIPrompt(e.target.value)}
                    disabled={aiLoading}
                  />
                  {aiError && <div className="tramo-ai-error">{aiError}</div>}
                  <button
                    type="button"
                    className="tramo-ai-generate-btn"
                    onClick={handleGenerateAI}
                    disabled={aiLoading || !aiPrompt.trim()}
                  >
                    {aiLoading ? (
                      <>
                        <span
                          style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }}
                        />
                        Consultando a la IA...
                      </>
                    ) : (
                      "Generar sugerencias →"
                    )}
                  </button>
                  <button type="button" className="tramo-ai-cancel-link" onClick={resetAI}>
                    Cancelar
                  </button>
                </div>
              )}

              {aiSuggestions.length > 0 && (
                <div className="tramo-ai-form">
                  <div className="tramo-ai-cards">
                    {aiSuggestions.map((s, i) => (
                      <div key={i} className="tramo-ai-card">
                        <div className="tramo-ai-card-header">
                          <span className="tramo-ai-card-dest">{s.destination.split(",")[0]}</span>
                          <span className="tramo-ai-nuevo-pill">NUEVO</span>
                        </div>
                        <p className="tramo-ai-card-desc">{s.description}</p>
                        <div className="tramo-ai-card-days">
                          <span className="tramo-ai-days-label">Días:</span>
                          <input
                            type="number"
                            className="tramo-ai-days-input"
                            min={1}
                            value={aiDays[i] ?? s.days}
                            onChange={(e) =>
                              setAIDays((prev) => ({ ...prev, [i]: Math.max(1, Number(e.target.value)) }))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {aiError && <div className="tramo-ai-error">{aiError}</div>}
                  <div className="tramo-ai-actions">
                    <button
                      type="button"
                      className="tramo-ai-confirm-btn"
                      onClick={handleCreateAITramos}
                      disabled={aiSaving}
                    >
                      {aiSaving ? "Creando tramos..." : "Crear tramos"}
                    </button>
                    <button type="button" className="tramo-ai-cancel-link" onClick={resetAI}>
                      Cancelar
                    </button>
                  </div>
                </div>
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
        <span className="tramo-fab-label">✨ Añadir o cambiar tramos</span>
      </button>
    </div>
  );
}

export default TramoSelector;
