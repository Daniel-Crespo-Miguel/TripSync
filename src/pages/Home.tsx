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
          <span className="hero-badge">Planifica · Colabora · Viaja</span>
          <h1 className="hero-title">
            Organizar viajes en grupo no debería ser un caos
          </h1>
          <p className="hero-subtitle">
            Centraliza decisiones, gastos y planificación en un solo lugar.
            Deja de perder tiempo en mensajes y hojas de cálculo.
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
              TripSync conecta con Claude AI para analizar tu destino, fechas, clima
              y preferencias del grupo. El resultado: sugerencias de actividades
              únicas, pensadas exactamente para vosotros.
            </p>
            <ul className="ai-features-list">
              <li>🗺️ Actividades personalizadas según destino y clima</li>
              <li>👥 Adaptadas al tamaño y preferencias de tu grupo</li>
              <li>🚆 Sugerencias de transporte inteligentes (próximamente)</li>
            </ul>
          </div>

          <div className="ai-section__right">
            <div className="ai-mock-card">
              <div className="ai-mock-card__header">✨ Sugerencias para Madrid</div>
              <div className="ai-mock-suggestion">
                <span className="ai-mock-pill ai-mock-pill--cultural">Cultural</span>
                <span className="ai-mock-title">Visita al Museo del Prado</span>
              </div>
              <div className="ai-mock-suggestion">
                <span className="ai-mock-pill ai-mock-pill--gastro">Gastronomía</span>
                <span className="ai-mock-title">Ruta de tapas por La Latina</span>
              </div>
              <div className="ai-mock-suggestion">
                <span className="ai-mock-pill ai-mock-pill--nature">Naturaleza</span>
                <span className="ai-mock-title">Retiro Park morning walk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuevo Banner Visual */}
      <section className="banner-section" id="banner-seccion">
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
