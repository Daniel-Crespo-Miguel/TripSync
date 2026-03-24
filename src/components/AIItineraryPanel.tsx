import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useAIItinerary } from "../hooks/useAIItinerary";
import { ItineraryDay } from "../types/ai";
import "../styles/aiItinerary.css";

interface Props {
  groupId: string;
  tramoId: string;
  destination: string;
  userEmail: string;
  participantCount: number;
  existingItinerary: string[];
  startDate?: { seconds: number };
  endDate?: { seconds: number };
}

function toDateStr(seconds: number) {
  return new Date(seconds * 1000).toISOString().split("T")[0];
}

const makeKey = (dayDate: string, actIdx: number) => `${dayDate}::${actIdx}`;

export default function AIItineraryPanel({
  groupId,
  tramoId,
  destination,
  userEmail,
  participantCount,
  existingItinerary,
  startDate,
  endDate,
}: Props) {
  const [userPrompt, setUserPrompt] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { days, loading, error, generate, clear } = useAIItinerary();

  // Select all activities by default when days load
  useEffect(() => {
    if (!days || !Array.isArray(days) || days.length === 0) return;
    const keys = new Set<string>();
    days.forEach((day) =>
      (day.activities ?? []).forEach((_, idx) => keys.add(makeKey(day.date, idx)))
    );
    setSelectedKeys(keys);
  }, [days]);

  const handleGenerate = async () => {
    if (!userPrompt.trim() || !destination) return;
    setSuccessMsg(null);
    await generate(
      {
        destination,
        dates:
          startDate && endDate
            ? `${toDateStr(startDate.seconds)} - ${toDateStr(endDate.seconds)}`
            : "",
        groupId,
        participantCount,
        userPrompt: userPrompt.trim(),
        existingActivities: existingItinerary,
      }
    );
  };

  const toggleActivity = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleDay = (day: ItineraryDay, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      day.activities.forEach((_, idx) => {
        const key = makeKey(day.date, idx);
        if (checked) next.add(key);
        else next.delete(key);
      });
      return next;
    });
  };

  const isDayAllSelected = (day: ItineraryDay) =>
    day.activities.every((_, idx) => selectedKeys.has(makeKey(day.date, idx)));

  const selectedCount = selectedKeys.size;

  const handleSave = async () => {
    if (selectedCount === 0 || saving) return;
    setSaving(true);
    try {
      const col = collection(db, "grupos", groupId, "tramos", tramoId, "itinerario");
      const writes: Promise<unknown>[] = [];
      days.forEach((day) => {
        day.activities.forEach((act, idx) => {
          if (!selectedKeys.has(makeKey(day.date, idx))) return;
          writes.push(
            addDoc(col, {
              date: day.date,
              time: act.time || undefined,
              title: act.title,
              notes: act.notes
                ? `${act.description} — ${act.notes}`
                : act.description || undefined,
              createdBy: userEmail,
              createdAt: serverTimestamp(),
            })
          );
        });
      });

      await Promise.all(writes);

      const count = writes.length;
      clear();
      setUserPrompt("");
      setSelectedKeys(new Set());
      setSuccessMsg(`¡Itinerario guardado! ${count} actividades añadidas. Revísalo abajo.`);
    } catch (e) {
      console.error("[AIItineraryPanel] save error", e);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clear();
    setSelectedKeys(new Set());
    setSuccessMsg(null);
  };

  return (
    <div className="ai-itinerary-panel">
      {/* Trigger card */}
      <div className="ai-panel-card">
        <div className="ai-panel-card__header">
          <span className="ai-panel-card__icon">✨</span>
          <div>
            <div className="ai-panel-card__title">Genera tu itinerario con IA</div>
            <div className="ai-panel-card__subtitle">
              Describe qué tipo de viaje quieres y la IA creará un plan día a día para{" "}
              <strong>{destination || "vuestro destino"}</strong>
            </div>
          </div>
        </div>

        {!destination ? (
          <p className="ai-suggestions-panel__no-dest">
            Añade un destino al grupo para poder generar el itinerario.
          </p>
        ) : (
          <div className="ai-suggestions-panel__trigger">
            <textarea
              className="form-control ai-suggestions-panel__prompt"
              style={{ minHeight: "120px" }}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Ej: Queremos un viaje cultural con gastronomía, mañanas relajadas y tardes activas. Evitar museos muy grandes..."
              disabled={loading}
            />
            <button
              className="ai-suggestions-panel__btn"
              onClick={handleGenerate}
              disabled={loading || !userPrompt.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Generando tu itinerario personalizado...
                </>
              ) : (
                "✨ Generar itinerario con IA"
              )}
            </button>
          </div>
        )}
      </div>

      {error && <div className="feedback-error" style={{ marginTop: "0.75rem" }}>{error}</div>}

      {successMsg && <div className="ai-itinerary-success">{successMsg}</div>}

      {/* Preview */}
      {days.length > 0 && (
        <div className="ai-itinerary-preview">
          <div className="ai-itinerary-preview__header">
            <p className="ai-itinerary-preview__title">
              Tu itinerario generado — selecciona qué guardar
            </p>
            <button className="ai-itinerary-clear-btn" onClick={handleClear}>
              Limpiar
            </button>
          </div>

          {days.map((day, dayIdx) => (
            <div key={day.date} className="ai-itinerary-day">
              <div className="ai-itinerary-day__header">
                <input
                  type="checkbox"
                  className="ai-itinerary-day__checkbox"
                  checked={isDayAllSelected(day)}
                  onChange={(e) => toggleDay(day, e.target.checked)}
                />
                <span className="ai-itinerary-day__badge">{dayIdx + 1}</span>
                <span className="ai-itinerary-day__label">{day.dayLabel}</span>
              </div>

              {day.activities.map((act, actIdx) => {
                const key = makeKey(day.date, actIdx);
                const checked = selectedKeys.has(key);
                return (
                  <div
                    key={actIdx}
                    className={`ai-itinerary-row${!checked ? " ai-itinerary-row--unchecked" : ""}`}
                    onClick={() => toggleActivity(key)}
                  >
                    <input
                      type="checkbox"
                      className="ai-itinerary-row__checkbox"
                      checked={checked}
                      onChange={() => toggleActivity(key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="ai-itinerary-row__time">{act.time}</div>
                    <div className="ai-itinerary-row__divider" />
                    <div className="ai-itinerary-row__body">
                      <span className="ai-itinerary-row__title">{act.title}</span>
                      {act.description && (
                        <p className="ai-itinerary-row__desc">{act.description}</p>
                      )}
                      {act.notes && (
                        <p className="ai-itinerary-row__notes">{act.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="ai-itinerary-preview__footer">
            <span className="ai-itinerary-counter">
              <strong>{selectedCount}</strong> actividades seleccionadas
            </span>
            <button
              className="ai-itinerary-save-btn"
              onClick={handleSave}
              disabled={selectedCount === 0 || saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Guardando...
                </>
              ) : (
                "✨ Guardar itinerario seleccionado"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
