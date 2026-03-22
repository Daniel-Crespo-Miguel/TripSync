import { TransportSuggestion } from "../types/ai";

const getIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("vuel") || t.includes("avi") || t.includes("aer")) return "✈️";
  if (t.includes("tren") || t.includes("ave") || t.includes("ferr")) return "🚆";
  if (t.includes("bus") || t.includes("autob")) return "🚌";
  if (t.includes("coche") || t.includes("car") || t.includes("blabl") || t.includes("alquil")) return "🚗";
  if (t.includes("metro") || t.includes("públic") || t.includes("public") || t.includes("transp")) return "🚇";
  if (t.includes("bici") || t.includes("patin")) return "🚲";
  if (t.includes("ferry") || t.includes("barco")) return "⛴️";
  return "🚀";
};

const getPillClass = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("vuel") || t.includes("avi") || t.includes("aer")) return "avion";
  if (t.includes("tren") || t.includes("ave") || t.includes("ferr")) return "tren";
  if (t.includes("bus") || t.includes("autob")) return "bus";
  if (t.includes("coche") || t.includes("car") || t.includes("blabl") || t.includes("alquil")) return "coche";
  if (t.includes("ferry") || t.includes("barco")) return "ferry";
  return "other";
};

interface Props {
  suggestion: TransportSuggestion;
}

function AITransportCard({ suggestion }: Props) {
  const raw = ((suggestion as any).type || suggestion.mode || "");
  const icon = getIcon(raw);
  const pillClass = getPillClass(raw);
  const label = raw || "Transporte";
  const title = suggestion.title ?? "";
  const description = suggestion.description ?? "";
  const duration = suggestion.estimatedDuration ?? "";
  const cost = suggestion.estimatedCost ?? "";
  const firstTip: string | undefined = suggestion.tips?.[0] ?? (suggestion as any).tip;

  return (
    <div className="ai-transport-card">
      <div className="ai-transport-card__header">
        <span className="ai-transport-card__icon">{icon}</span>
        <span className={`ai-transport-card__pill ai-transport-card__pill--${pillClass}`}>{label}</span>
      </div>
      <p className="ai-transport-card__title">{title}</p>
      <p className="ai-transport-card__description">{description}</p>
      <div className="ai-transport-card__chips">
        {duration && <span className="ai-transport-chip">⏱ {duration}</span>}
        {cost && <span className="ai-transport-chip">💶 {cost}</span>}
      </div>
      {firstTip && (
        <div className="ai-transport-card__tip">💡 {firstTip}</div>
      )}
    </div>
  );
}

export default AITransportCard;
