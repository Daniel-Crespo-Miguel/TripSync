import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAISuggestions } from "../hooks/useAISuggestions";
import { AISuggestion } from "../types/ai";
import AISuggestionCard from "./AISuggestionCard";
import { buildWeatherSummary } from "../utils/weatherUtils";
import "../styles/aiSuggestions.css";

type Props = {
  groupId: string;
  tramoId: string;
  destination: string;
  userEmail: string;
  participantCount: number;
  existingActivities: string[];
  startDate?: { seconds: number } | null;
  endDate?: { seconds: number } | null;
};

export default function AISuggestionsPanel({
  groupId,
  tramoId,
  destination,
  userEmail,
  participantCount,
  existingActivities,
  startDate,
  endDate,
}: Props) {
  const { suggestions, loading, error, getSuggestions, clear } = useAISuggestions();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");

  const formatDate = (ts: { seconds: number } | null | undefined): string => {
    if (!ts?.seconds) return "";
    return new Date(ts.seconds * 1000).toLocaleDateString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const handleGenerate = async () => {
    setOpen(true);
    const dates = startDate && endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : "";
    const weatherSummary = await buildWeatherSummary(destination, startDate, endDate);
    await getSuggestions(
      {
        destination,
        dates,
        groupId,
        participantCount,
        existingActivities,
        weatherSummary,
        userPrompt: userPrompt.trim() || undefined,
      },
      userEmail
    );
  };

  const handleAdd = async (suggestion: AISuggestion) => {
    if (addedIds.has(suggestion.id)) return;
    setAddingId(suggestion.id);

    try {
      await addDoc(collection(db, "grupos", groupId, "tramos", tramoId, "actividades"), {
        title: suggestion.title,
        description: `${suggestion.description}${suggestion.recommendedDay ? ` · ${suggestion.recommendedDay}` : ""}`,
        location: destination || undefined,
        createdBy: userEmail,
        createdAt: serverTimestamp(),
        votes: [],
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
        <div className="ai-panel-card">
          <div className="ai-panel-card__header">
            <span className="ai-panel-card__icon">✨</span>
            <div>
              <div className="ai-panel-card__title">Sugerencias con Inteligencia Artificial</div>
              <div className="ai-panel-card__subtitle">
                Describe tu grupo y la IA generará actividades personalizadas
                {destination ? ` para ${destination.split(",")[0].trim()}` : ""}
              </div>
            </div>
          </div>
          <textarea
            className="form-control ai-suggestions-panel__prompt"
            placeholder="Ej: somos 4 amigos jóvenes, nos encanta la gastronomía y la vida nocturna..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            disabled={loading}
            rows={3}
            maxLength={300}
          />
          <button
            className="ai-suggestions-panel__btn"
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
            <div className="ai-error">⚠️ {error}</div>
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
