import { useState } from "react";
import { useAIFeedback } from "../hooks/useAIFeedback";
import "../styles/aiFeedback.css";

type Props = {
  userEmail: string;
  userId: string;
};

const sentimentConfig = {
  positivo: { icon: "😊", label: "Positivo" },
  neutral:  { icon: "😐", label: "Neutral" },
  negativo: { icon: "😟", label: "Negativo" },
};

export default function FeedbackForm({ userEmail, userId }: Props) {
  const [text, setText] = useState("");
  const { result, loading, error, submitFeedback, clear } = useAIFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await submitFeedback(text.trim(), userEmail, userId);
  };

  const handleClear = () => {
    setText("");
    clear();
  };

  return (
    <div className="feedback-form">
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">
            ¿Cómo va el viaje? Cuéntanos tu experiencia
          </label>
          <textarea
            className="form-control feedback-form__textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe aquí tu opinión sobre el grupo, el destino, la organización..."
            disabled={loading}
            maxLength={1000}
          />
          <div className="form-text text-end">{text.length}/1000</div>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
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

          {(result || error) && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleClear}
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="alert alert-warning mt-3">{error}</div>
      )}

      {result && (
        <div className={`feedback-result feedback-result--${result.sentiment}`}>
          <div className="feedback-result__header">
            <span className="feedback-result__icon">
              {sentimentConfig[result.sentiment as keyof typeof sentimentConfig].icon}
            </span>
            <span className="feedback-result__label">
              {sentimentConfig[result.sentiment as keyof typeof sentimentConfig].label}
            </span>
          </div>
          <p className="feedback-result__summary">{result.summary}</p>
        </div>
      )}
    </div>
  );
}
