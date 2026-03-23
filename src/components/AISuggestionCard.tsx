import { AISuggestion } from "../types/ai";

type Props = {
  suggestion: AISuggestion;
  onAdd: (suggestion: AISuggestion) => void;
  adding: boolean;
  added: boolean;
};

const categoryIcons: Record<string, string> = {
  Cultural: "🏛️",
  Aventura: "🧗",
  Gastronomía: "🍽️",
  Naturaleza: "🌿",
  Ocio: "🎭",
  Compras: "🛍️",
};

export default function AISuggestionCard({ suggestion, onAdd, adding, added }: Props) {
  const icon = categoryIcons[suggestion.category] ?? "📍";

  return (
    <div className="ai-suggestion-card">
      <div className="ai-suggestion-card__header">
        <span className="ai-suggestion-card__icon">{icon}</span>
        <span className="ai-suggestion-card__category">{suggestion.category}</span>
      </div>
      <h5 className="ai-suggestion-card__title">{suggestion.title}</h5>
      <p className="ai-suggestion-card__description">{suggestion.description}</p>
      <button
        className={`btn btn-sm ai-suggestion-card__btn ${added ? "btn-success" : "btn-outline-primary"}`}
        onClick={() => onAdd(suggestion)}
        disabled={adding || added}
      >
        {added ? "Añadido ✓" : adding ? "Añadiendo..." : "Añadir al grupo"}
      </button>
    </div>
  );
}
