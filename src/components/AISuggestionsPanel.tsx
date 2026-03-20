import { useState } from "react";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAISuggestions } from "../hooks/useAISuggestions";
import { AISuggestion } from "../types/ai";
import AISuggestionCard from "./AISuggestionCard";
import "../styles/aiSuggestions.css";

type Props = {
  groupId: string;
  destination: string;
  userEmail: string;
};

export default function AISuggestionsPanel({ groupId, destination, userEmail }: Props) {
  const { suggestions, loading, error, getSuggestions, clear } = useAISuggestions();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    setOpen(true);
    await getSuggestions(destination, "", groupId, userEmail);
  };

  const handleAdd = async (suggestion: AISuggestion) => {
    if (addedIds.has(suggestion.id)) return;
    setAddingId(suggestion.id);

    try {
      const newActivity = {
        id: crypto.randomUUID(),
        title: suggestion.title,
        description: `${suggestion.description}${suggestion.recommendedDay ? ` · ${suggestion.recommendedDay}` : ""}`,
        location: destination || undefined,
        createdBy: userEmail,
        createdAt: new Date().toISOString(),
        votes: [],
      };

      await updateDoc(doc(db, "grupos", groupId), {
        activities: arrayUnion(newActivity),
      });

      setAddedIds((prev) => new Set(prev).add(suggestion.id));
    } catch (e) {
      console.error("[AISuggestionsPanel] Error adding activity", e);
      alert("Error al añadir la actividad. Inténtalo de nuevo.");
    } finally {
      setAddingId(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    clear();
    setAddedIds(new Set());
  };

  return (
    <div className="ai-suggestions-panel">
      <div className="ai-suggestions-panel__trigger">
        <button
          className="btn btn-outline-primary ai-suggestions-panel__btn"
          type="button"
          onClick={handleGenerate}
          disabled={loading || !destination}
          title={!destination ? "El grupo no tiene destino definido" : undefined}
        >
          ✨ Generar sugerencias con IA
        </button>
        {!destination && (
          <p className="ai-suggestions-panel__no-dest">
            Define un destino en el grupo para usar esta función.
          </p>
        )}
      </div>

      {open && (
        <div className="ai-suggestions-panel__body">
          <div className="ai-suggestions-panel__header">
            <h5 className="ai-suggestions-panel__title">
              Sugerencias IA para <strong>{destination}</strong>
            </h5>
            <button
              className="btn-close"
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
            />
          </div>

          {loading && (
            <div className="ai-suggestions-panel__loading">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              Generando sugerencias con IA...
            </div>
          )}

          {error && (
            <div className="alert alert-warning mb-0">{error}</div>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <div className="ai-suggestions-panel__grid">
              {suggestions.map((s) => (
                <AISuggestionCard
                  key={s.id}
                  suggestion={s}
                  onAdd={handleAdd}
                  adding={addingId === s.id}
                  added={addedIds.has(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
