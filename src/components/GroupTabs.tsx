import { useState, useEffect } from "react";
import { useGroup } from "../contexts/GroupContext";
import { useLocation, useParams, Link, Outlet, useNavigate } from "react-router-dom";
import "../styles/group-tabs.css";

function GroupTabs() {
  const { grupo, loading, error } = useGroup();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  // Determinar qué tab está activa basado en la ruta actual
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/actividades')) return 'actividades';
    if (path.includes('/itinerario')) return 'itinerario';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/clima')) return 'clima';
    if (path.includes('/transporte')) return 'transporte';
    if (path.includes('/gastos')) return 'gastos';
    if (path.includes('/feedback')) return 'feedback';
    return 'overview'; // Por defecto
  };

  const activeTab = getActiveTab();

  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  useEffect(() => {
    if (!grupo?.destination) return;
    const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
    if (!key) return;
    const dest = grupo.destination.split(",")[0].trim();
    fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dest)}&per_page=1&orientation=landscape&w=1600&client_id=${key}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const url = data?.results?.[0]?.urls?.full ?? data?.results?.[0]?.urls?.regular;
        if (url) setHeroPhoto(url);
      })
      .catch(() => {});
  }, [grupo?.destination]);

  if (loading) {
    return (
      <div className="group-tabs-container">
        <div className="container">
          <div className="loading-spinner">Cargando grupo...</div>
        </div>
      </div>
    );
  }

  if (error || !grupo) {
    return (
      <div className="group-tabs-container">
        <div className="container">
          <div className="error-message">Error al cargar el grupo: {error || "Grupo no encontrado"}</div>
        </div>
      </div>
    );
  }

  const fechaInicio = new Date(grupo.startDate.seconds * 1000).toLocaleDateString();
  const fechaFin = new Date(grupo.endDate.seconds * 1000).toLocaleDateString();

  const now = new Date();
  const startMs = grupo.startDate.seconds * 1000;
  const endMs = grupo.endDate.seconds * 1000;
  const daysUntil = Math.ceil((startMs - now.getTime()) / (1000 * 60 * 60 * 24));
  const tripStatus =
    now.getTime() < startMs
      ? `✈️ Faltan ${daysUntil} días`
      : now.getTime() <= endMs
      ? "🌍 ¡Viaje en curso!"
      : "✅ Viaje finalizado";

  const heroStyle = heroPhoto
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.20)), url(${heroPhoto})`,
      }
    : undefined;

  return (
    <div className="group-tabs-container">
      {/* Hero photo preloader — hidden, triggers fade-in when ready */}
      {heroPhoto && (
        <img
          src={heroPhoto}
          alt=""
          style={{ display: "none" }}
          onLoad={() => setPhotoLoaded(true)}
        />
      )}

      {/* Header del viaje */}
      <div
        className={`group-header${photoLoaded ? " group-header--photo" : ""}`}
        style={heroStyle}
      >
        <div className="container">
          <div className="group-header-content">
            <div className="group-title-section">
              <h1 className="group-title">{grupo.name}</h1>
              <div className="group-meta">
                <span className="group-creator">Creado por: {grupo.createdByEmail}</span>
              </div>
              <span className="hero-status-badge">{tripStatus}</span>
            </div>

            <div className="group-info-grid">
              <div className="group-info-card">
                <div className="info-label">Destino</div>
                <div className="info-value">{grupo.destination}</div>
              </div>

              <div className="group-info-card">
                <div className="info-label">Fechas</div>
                <div className="info-value">{fechaInicio} – {fechaFin}</div>
              </div>

              <div className="group-info-card">
                <div className="info-label">Participantes</div>
                <div className="info-value">{grupo.invitados.length} viajeros</div>
                <div className="hero-avatars">
                  {grupo.invitados.slice(0, 5).map((email, i) => (
                    <span key={i} className="hero-avatar" title={email}>
                      {email.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  {grupo.invitados.length > 5 && (
                    <span className="hero-avatar hero-avatar--more">
                      +{grupo.invitados.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Tabs */}
      <div className="tabs-container">
        <div className="container">
          <div className="tabs-bar">
            <button className="btn-tab-back" onClick={() => navigate("/dashboard")}>
              ← Mi panel
            </button>
            <nav className="tabs-nav">
              <Link
                to={`/grupo/${id}`}
                className={`tab-item ${activeTab === 'overview' ? 'tab-active' : ''}`}
              >
                Visión general
              </Link>
              <Link
                to={`/grupo/${id}/itinerario`}
                className={`tab-item ${activeTab === 'itinerario' ? 'tab-active' : ''}`}
              >
                Itinerario
              </Link>
              <Link
                to={`/grupo/${id}/actividades`}
                className={`tab-item ${activeTab === 'actividades' ? 'tab-active' : ''}`}
              >
                Actividades
              </Link>
              <Link
                to={`/grupo/${id}/gastos`}
                className={`tab-item ${activeTab === 'gastos' ? 'tab-active' : ''}`}
              >
                Gastos
              </Link>
              <Link
                to={`/grupo/${id}/chat`}
                className={`tab-item ${activeTab === 'chat' ? 'tab-active' : ''}`}
              >
                Chat
              </Link>
              <Link
                to={`/grupo/${id}/clima`}
                className={`tab-item ${activeTab === 'clima' ? 'tab-active' : ''}`}
              >
                Clima
              </Link>
              <Link
                to={`/grupo/${id}/transporte`}
                className={`tab-item ${activeTab === 'transporte' ? 'tab-active' : ''}`}
              >
                Transporte
              </Link>
              <Link
                to={`/grupo/${id}/feedback`}
                className={`tab-item ${activeTab === 'feedback' ? 'tab-active' : ''}`}
              >
                💬 Feedback
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Contenido de la tab activa - usando Outlet para renderizar el contenido de cada ruta */}
      <div className="tab-content">
        <div className="container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default GroupTabs;
