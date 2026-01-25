import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import bannerHome from '../assets/Banner_Home.png';

function Home() {
  const [user, setUser] = React.useState<User | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Organiza tus viajes en grupo de forma colaborativa
              </h1>
              <p className="hero-subtitle">
                TripSync te ayuda a planificar, gestionar y disfrutar tus viajes 
                con amigos o familiares. Todo en un solo lugar, sin complicaciones.
              </p>
              <div className="hero-cta">
                <button 
                  className="btn btn-primary"
                  onClick={handleStart}
                >
                  {user ? 'Ir a mi panel' : 'Empezar ahora'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-placeholder">
                Ilustración del producto o placeholder visual
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección "Sobre la web" */}
      <section className="section" id="sobre-web">
        <h2 className="section-title">¿Qué puedes hacer con TripSync?</h2>
        <p className="section-subtitle">
          Una plataforma completa para organizar cada aspecto de tus viajes en grupo, 
          desde la planificación hasta el regreso a casa.
        </p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-center">✈️</div>
            <h3 className="feature-title">Organización de Grupos</h3>
            <p className="feature-description">
              Crea grupos de viaje, invita a amigos o familiares y mantén a todos 
              informados en un solo lugar. Control total para el organizador y 
              participación activa para todos los miembros.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">💰</div>
            <h3 className="feature-title">Gestión de Gastos</h3>
            <p className="feature-description">
              Sistema tipo Tricount para gestionar gastos compartidos. 
              Registra gastos, asigna participantes y calcula automáticamente 
              los balances. Olvídate de las cuentas complicadas.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">🎯</div>
            <h3 className="feature-title">Actividades y Votaciones</h3>
            <p className="feature-description">
              Propón actividades, permite que todos voten o se apunten, 
              y descubre sugerencias automáticas basadas en tu destino. 
              Planifica el itinerario de forma democrática y divertida.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">📅</div>
            <h3 className="feature-title">Itinerario por Días</h3>
            <p className="feature-description">
              Organiza tu viaje día a día con horarios específicos. 
              Añade actividades, notas y detalles importantes para 
              cada momento del viaje.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">🌤️</div>
            <h3 className="feature-title">Clima del Destino</h3>
            <p className="feature-description">
              Previsión meteorológica detallada para tu destino usando 
              Open-Meteo. Planifica tu equipaje y actividades según 
              el clima esperado.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-center">💬</div>
            <h3 className="feature-title">Chat en Tiempo Real</h3>
            <p className="feature-description">
              Comunicación instantánea entre los miembros del grupo. 
              Coordina cambios, comparte información y mantente en 
              contacto durante todo el viaje.
            </p>
          </div>
        </div>
      </section>

      {/* Nuevo Banner Visual */}
      <section className="banner-section" id="banner-seccion">
        <div className="banner-container">
          <div className="banner-content">
            <h2 className="banner-title">
              Viaja sin preocupaciones, disfruta sin complicaciones
            </h2>
            <p className="banner-subtitle">
              Deja que TripSync se encargue de la organización mientras tú te centras 
              en crear recuerdos inolvidables con las personas que más te importan.
            </p>
            <button 
              className="btn btn-primary banner-cta"
              onClick={handleStart}
            >
              Empieza a planificar tu viaje
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
