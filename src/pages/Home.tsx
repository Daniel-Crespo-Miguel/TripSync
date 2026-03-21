import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import bannerImg from "../assets/Banner_Home.png";

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

      {/* Sección "Sobre la web" */}
      <section className="section" id="sobre-web">
        <h2 className="section-title">¿Qué puedes hacer con TripSync?</h2>
        <p className="section-subtitle">
          Una plataforma completa para organizar cada aspecto de tus viajes en
          grupo, desde la planificación hasta el regreso a casa.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-center">✈️</div>
            <h3 className="feature-title">Organización de Grupos</h3>
            <p className="feature-description">
              Crea grupos de viaje, invita a amigos o familiares y mantén a
              todos informados en un solo lugar. Control total para el
              organizador y participación activa para todos los miembros.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">💰</div>
            <h3 className="feature-title">Gestión de Gastos</h3>
            <p className="feature-description">
              Sistema tipo Tricount para gestionar gastos compartidos. Registra
              gastos, asigna participantes y calcula automáticamente los
              balances. Olvídate de las cuentas complicadas.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">🎯</div>
            <h3 className="feature-title">Actividades y Votaciones</h3>
            <p className="feature-description">
              Propón actividades, permite que todos voten o se apunten, y
              descubre sugerencias automáticas basadas en tu destino. Planifica
              el itinerario de forma democrática y divertida.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">📅</div>
            <h3 className="feature-title">Itinerario por Días</h3>
            <p className="feature-description">
              Organiza tu viaje día a día con horarios específicos. Añade
              actividades, notas y detalles importantes para cada momento del
              viaje.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">🌤️</div>
            <h3 className="feature-title">Clima del Destino</h3>
            <p className="feature-description">
              Previsión meteorológica detallada para tu destino usando
              Open-Meteo. Planifica tu equipaje y actividades según el clima
              esperado.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">💬</div>
            <h3 className="feature-title">Chat en Tiempo Real</h3>
            <p className="feature-description">
              Comunicación instantánea entre los miembros del grupo. Coordina
              cambios, comparte información y mantente en contacto durante todo
              el viaje.
            </p>
          </div>
        </div>
      </section>

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
