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
    description: "Crea un viaje multi-destino, añade fechas globales e invita a tu grupo. El organizador tiene control total desde el primer momento.",
    detail: [
      "Define destino principal y fechas del viaje",
      "Invita participantes por email",
      "Divide el viaje en tramos con destinos independientes",
      "La IA puede sugerirte cómo dividir la ruta automáticamente"
    ],
    icon: "👥",
  },
  {
    id: 2,
    label: "Propón actividades",
    title: "Cada miembro propone planes",
    description: "Cualquier participante puede añadir actividades por tramo. La IA sugiere planes personalizados según el destino, el clima y las preferencias del grupo.",
    detail: [
      "Añade actividades manualmente con título, descripción y fecha",
      "Pide sugerencias a Claude AI según vuestro perfil",
      "Las sugerencias se añaden al tramo activo con un clic",
      "Explora puntos de interés cercanos via OpenStreetMap"
    ],
    icon: "📍",
  },
  {
    id: 3,
    label: "Votad y decidid",
    title: "La democracia decide el itinerario",
    description: "El grupo vota las actividades propuestas. Las más votadas suben en el ranking. Sin discusiones por WhatsApp, todo centralizado.",
    detail: [
      "Vota las actividades que más te gustan",
      "Ranking automático por votos en tiempo real",
      "Genera el itinerario completo día a día con IA en un clic",
      "Edita cualquier elemento del itinerario de forma inline"
    ],
    icon: "✓",
  },
  {
    id: 4,
    label: "Controla los gastos",
    title: "Gastos compartidos sin dramas",
    description: "Registra quién pagó qué, asigna participantes y TripSync calcula los balances automáticamente. Sube PDFs de reservas y la IA extrae los datos.",
    detail: [
      "Registro de gastos por categoría con división personalizada",
      "Cálculo automático de deudas y liquidaciones",
      "Sube PDFs de reservas — la IA extrae fechas, importes y detalles",
      "Timeline cronológico de todos los documentos del viaje"
    ],
    icon: "💶",
  },
  {
    id: 5,
    label: "IA te sugiere",
    title: "Tu copiloto de viaje inteligente",
    description: "En cada fase del viaje, TripSync te ofrece ayuda inteligente. Pídele consejo cuando lo necesites — antes, durante y después del viaje.",
    detail: [
      "Antes de salir: pide a la IA que diseñe tu ruta por tramos",
      "Planificando: genera actividades e itinerario completo con un clic",
      "De viaje: consulta transporte entre destinos en tiempo real",
      "Al volver: analiza cómo vivió el grupo la experiencia"
    ],
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
