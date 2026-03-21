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
    <div className="transport-card">
      <div className="transport-card__header">
        <span className="transport-card__icon">{icon}</span>
        <span className={`transport-card__pill transport-card__pill--${pillClass}`}>{label}</span>
      </div>
      <p className="transport-card__title">{title}</p>
      <p className="transport-card__description">{description}</p>
      <div className="transport-card__chips">
        {duration && <span className="transport-chip">⏱ {duration}</span>}
        {cost && <span className="transport-chip">💶 {cost}</span>}
      </div>
      {firstTip && (
        <div className="transport-card__tip">💡 {firstTip}</div>
      )}
    </div>
  );
}

export default AITransportCard;
