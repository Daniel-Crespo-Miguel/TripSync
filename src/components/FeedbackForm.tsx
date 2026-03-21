import { useState } from "react";
import { useAIFeedback } from "../hooks/useAIFeedback";
import "../styles/aiFeedback.css";

type Props = {
  userEmail: string;
  userId: string;
  groupId: string;
};

const sentimentConfig = {
  positivo: { icon: "😊", label: "Positivo" },
  neutral:  { icon: "😐", label: "Neutral" },
  negativo: { icon: "😟", label: "Negativo" },
};

export default function FeedbackForm({ userEmail, userId, groupId }: Props) {
  const [text, setText] = useState("");
  const { result, loading, error, submitFeedback, clear } = useAIFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await submitFeedback(text.trim(), userEmail, userId, groupId);
  };

  const handleClear = () => {
    setText("");
    clear();
  };

  const cfg = result
    ? sentimentConfig[result.sentiment as keyof typeof sentimentConfig]
    : null;

  return (
    <div className="feedback-form">
      <div className="feedback-card">
        <form onSubmit={handleSubmit}>
          <div className="feedback-field">
            <label className="feedback-label">
              ¿Cómo va el viaje? Cuéntanos tu experiencia
            </label>
            <textarea
              className="feedback-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe aquí tu opinión sobre el grupo, el destino, la organización..."
              disabled={loading}
              maxLength={1000}
            />
            <div className="feedback-char-count">{text.length}/1000</div>
          </div>

          <button
            className="btn-feedback-submit"
            type="submit"
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Analizando...
              </>
            ) : (
              "✨ Analizar feedback"
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="feedback-error">{error}</div>
      )}

      {!result && !error && (
        <div className="feedback-result-placeholder">
          <span className="feedback-placeholder-icon">🔍</span>
          <span className="feedback-placeholder-text">Tu análisis aparecerá aquí</span>
        </div>
      )}

      {result && cfg && (
        <div className={`feedback-result feedback-result--${result.sentiment}`}>
          <div className="feedback-result-emoji">{cfg.icon}</div>
          <div className={`feedback-result-label feedback-result-label--${result.sentiment}`}>
            {cfg.label}
          </div>
          <p className="feedback-result-summary">{result.summary}</p>
          {(result || error) && (
            <button className="feedback-clear-btn" type="button" onClick={handleClear}>
              Limpiar y escribir de nuevo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
