import { useState } from "react";
import { useAITransport } from "../hooks/useAITransport";
import AITransportCard from "./AITransportCard";
import "../styles/aiTransport.css";

interface Props {
  groupId: string;
  destination: string;
  originCity: string;
  dates: string;
  participantCount: number;
  userEmail: string;
}

function AITransportPanel({ groupId, destination, originCity, dates, participantCount, userEmail }: Props) {
  const { suggestions, loading, error, getSuggestions, clear } = useAITransport();
  const [userPrompt, setUserPrompt] = useState("");
  const [hasRequested, setHasRequested] = useState(false);

  const canRequest = !!destination && !!userEmail;

  async function handleRequest() {
    setHasRequested(true);
    await getSuggestions(
      { destination, originCity, dates, groupId, participantCount, userPrompt: userPrompt.trim() || undefined },
      userEmail
    );
  }

  function handleClear() {
    clear();
    setHasRequested(false);
    setUserPrompt("");
  }

  return (
    <div className="ai-transport-panel">
      <div className="ai-transport-panel__card">
        <div className="ai-transport-panel__card-header">
          <span className="ai-transport-panel__card-icon">✨</span>
          <div>
            <div className="ai-transport-panel__card-title">Sugerencias de transporte con IA</div>
            <div className="ai-transport-panel__card-subtitle">
              Claude AI analiza tu destino, origen y fechas para recomendarte la mejor opción de transporte.
            </div>
          </div>
        </div>

        <div className="ai-transport-panel__trigger">
          <textarea
            className="ai-transport-panel__prompt form-control"
            placeholder="(Opcional) Añade preferencias: presupuesto, si vais con niños, equipaje voluminoso…"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            rows={2}
          />

          {!canRequest && (
            <p className="ai-transport-panel__no-dest">
              Introduce el destino del viaje para activar las sugerencias con IA.
            </p>
          )}

          <button
            className="ai-transport-panel__btn"
            disabled={!canRequest || loading}
            onClick={handleRequest}
          >
            {loading ? "Analizando ruta…" : "✨ Sugerir transporte con IA"}
          </button>
        </div>
      </div>

      {(hasRequested && !loading) && (
        <div className="ai-transport-panel__body">
          <div className="ai-transport-panel__body-header">
            <h6 className="ai-transport-panel__body-title">
              Sugerencias para ir a {destination}
            </h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleClear}
            >
              Limpiar
            </button>
          </div>

          {error && (
            <div className="ai-error">⚠️ {error}</div>
          )}

          {!error && suggestions.length === 0 && (
            <p className="text-muted">No se encontraron sugerencias.</p>
          )}

          {suggestions.length > 0 && (
            <div className="ai-transport-panel__grid">
              {suggestions.map((s) => (
                <AITransportCard key={s.id} suggestion={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AITransportPanel;
