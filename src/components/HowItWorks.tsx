import { useState } from "react";
import "../styles/howItWorks.css";

type Step = {
  id: number;
  label: string;
  title: string;
  description: string;
  detail: string[];
  icon: string;
};

const steps: Step[] = [
  {
    id: 1,
    label: "Crea el grupo",
    title: "Organiza a tu grupo en segundos",
    description: "Crea un viaje, añade destino y fechas, e invita a tus amigos o familia con un enlace.",
    detail: ["Define destino y fechas", "Invita participantes por email", "El organizador tiene control total"],
    icon: "👥",
  },
  {
    id: 2,
    label: "Propón actividades",
    title: "Cada miembro propone planes",
    description: "Cualquier participante puede añadir actividades al grupo. Desde museos hasta restaurantes.",
    detail: ["Añade título, descripción y fecha", "Incluye ubicación opcional", "Visible para todo el grupo"],
    icon: "📍",
  },
  {
    id: 3,
    label: "Votad y decidid",
    title: "La democracia decide el itinerario",
    description: "El grupo vota las actividades propuestas. Las más votadas pasan al itinerario final.",
    detail: ["Vota las actividades que más te gustan", "Ranking automático por votos", "Sin discusiones por WhatsApp"],
    icon: "✓",
  },
  {
    id: 4,
    label: "Controla los gastos",
    title: "Gastos compartidos sin dramas",
    description: "Registra gastos, asigna quién pagó y quién participa. TripSync calcula los balances automáticamente.",
    detail: ["Registro de gastos por categoría", "Cálculo automático de deudas", "Liquidación clara al final del viaje"],
    icon: "💶",
  },
  {
    id: 5,
    label: "IA te sugiere",
    title: "Inteligencia artificial a tu servicio",
    description: "Claude AI analiza tu destino, fechas y preferencias del grupo para sugerirte actividades y transporte personalizados.",
    detail: ["Sugerencias de actividades únicas", "Opciones de transporte inteligentes", "Adaptadas a vuestro grupo y clima"],
    icon: "✨",
  },
];

function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [fading, setFading] = useState<boolean>(false);

  const handleStepClick = (id: number) => {
    if (id === activeStep) return;
    setFading(true);
    setTimeout(() => {
      setActiveStep(id);
      setFading(false);
    }, 200);
  };

  const current = steps.find((s) => s.id === activeStep)!;

  return (
    <section className="how-it-works" id="sobre-web">
      <div className="how-it-works__inner">
        <h2 className="how-it-works__heading">¿Cómo funciona TripSync?</h2>
        <p className="how-it-works__subheading">De la idea al viaje perfecto, en pocos pasos</p>

        {/* Mobile: horizontal circles */}
        <div className="hiw-mobile-nav">
          {steps.map((step) => (
            <button
              key={step.id}
              className={`hiw-mobile-node${activeStep === step.id ? " hiw-mobile-node--active" : ""}`}
              onClick={() => handleStepClick(step.id)}
              aria-label={step.label}
            >
              {step.id}
            </button>
          ))}
        </div>

        {/* Desktop: two-column */}
        <div className="hiw-layout">
          {/* Left: timeline */}
          <div className="hiw-timeline">
            <div className="hiw-timeline__line" />
            {steps.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <div
                  key={step.id}
                  className={`hiw-node${isActive ? " hiw-node--active" : ""}`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div className="hiw-node__circle">{step.id}</div>
                  <span className="hiw-node__label">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Right: content card */}
          <div className={`hiw-card${fading ? " hiw-card--fading" : ""}`}>
            <div className="hiw-card__badge">
              Paso {current.id}
            </div>
            <h3 className="hiw-card__title">{current.title}</h3>
            <p className="hiw-card__description">{current.description}</p>
            <ul className="hiw-card__bullets">
              {current.detail.map((item, i) => (
                <li key={i} className="hiw-card__bullet">
                  <span className="hiw-card__bullet-prefix">›</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
