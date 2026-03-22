import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import bannerImg from "../assets/Banner_Home.png";
import HowItWorks from "../components/HowItWorks";

function Home() {
  const [user, setUser] = React.useState<User | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-card">
          <span className="hero-badge">Multi-destino · IA integrada · Colaboración en tiempo real</span>
          <h1 className="hero-title">
            Organizar viajes en grupo no debería ser un caos
          </h1>
          <p className="hero-subtitle">
            Planifica viajes multi-destino con tu grupo, deja que la IA organice los tramos, actividades e itinerario. Todo en un solo lugar.
          </p>
          <button className="hero-btn" onClick={handleStart}>
            Empezar a organizar
          </button>
        </div>
      </section>

      <HowItWorks />

      {/* Sección IA */}
      <section className="ai-section">
        <div className="ai-section__inner">
          <div className="ai-section__left">
            <span className="ai-badge">✨ IMPULSADO POR IA</span>
            <h2 className="ai-section__title">
              Tu viaje, pensado por inteligencia artificial
            </h2>
            <p className="ai-section__subtitle">
              TripSync integra Claude AI en cada etapa de tu viaje. Desde sugerir cómo dividir tu ruta en tramos hasta generar el itinerario completo día a día, con recomendaciones de transporte y actividades personalizadas para tu grupo.
            </p>
            <ul className="ai-features-list">
              <li>🗺️ Sugerencias de tramos: la IA divide tu ruta en destinos con días optimizados</li>
              <li>📅 Itinerario completo generado día a día con un solo clic</li>
              <li>🚆 Comparativa de transporte inteligente entre destinos</li>
              <li>📄 Extracción automática de datos desde PDFs de reservas</li>
              <li>😊 Análisis de sentimiento en el feedback del grupo</li>
            </ul>
          </div>

          <div className="ai-section__right">
            <div className="ai-mock-card">
              <div className="ai-mock-card__header">✨ Tramos sugeridos para Escocia</div>
              <div className="ai-mock-suggestion">
                <span className="ai-mock-pill ai-mock-pill--cultural">Tramo 1</span>
                <span className="ai-mock-title">Edimburgo · 3 días — Historia y castillos</span>
              </div>
              <div className="ai-mock-suggestion">
                <span className="ai-mock-pill ai-mock-pill--gastro">Tramo 2</span>
                <span className="ai-mock-title">Highlands · 4 días — Naturaleza y lochs</span>
              </div>
              <div className="ai-mock-suggestion">
                <span className="ai-mock-pill ai-mock-pill--nature">Tramo 3</span>
                <span className="ai-mock-title">Isla de Skye · 2 días — Paisajes únicos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuevo Banner Visual */}
      <section className="banner-section" id="que-ofrece">
        <img src={bannerImg} alt="" className="banner-bg-img" />
        <div className="banner-content">
          <h2 className="banner-title">
            Viaja sin preocupaciones, disfruta sin complicaciones
          </h2>
          <button
            className="btn btn-primary banner-cta"
            onClick={handleStart}
          >
            Empieza a planificar tu viaje
          </button>
          <div className="banner-contact-strip">
            <a href="mailto:crespiinx@gmail.com">crespiinx@gmail.com</a>
            {" · "}
            <a
              href="https://www.linkedin.com/in/daniel-crespo-miguel90"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
