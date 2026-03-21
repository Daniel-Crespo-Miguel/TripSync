import { useState, useEffect, useRef } from "react";
import { useGroup } from "../contexts/GroupContext";
import { useLocation, useParams, Link, Outlet, useNavigate } from "react-router-dom";
import "../styles/group-tabs.css";

const ICONS: Record<string, JSX.Element> = {
  overview: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  itinerario: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  actividades: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  gastos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="22" height="14" rx="2"/>
      <path d="M1 10h22"/>
      <circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  clima: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  transporte: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="9" width="22" height="11" rx="2"/>
      <path d="M4 9l3-6h10l3 6"/>
      <circle cx="7" cy="20" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  feedback: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      <path d="M12 10c0-.83.67-1.5 1.5-1.5S15 9.17 15 10c0 1.17-1.5 2.5-1.5 2.5S12 11.17 12 10z" fill="currentColor" stroke="none"/>
    </svg>
  ),
};



const TABS = [
  { key: 'overview',    label: 'General',    path: (id: string) => `/grupo/${id}` },
  { key: 'itinerario',  label: 'Itinerario', path: (id: string) => `/grupo/${id}/itinerario` },
  { key: 'actividades', label: 'Actividades',path: (id: string) => `/grupo/${id}/actividades` },
  { key: 'gastos',      label: 'Gastos',     path: (id: string) => `/grupo/${id}/gastos` },
  { key: 'chat',        label: 'Chat',       path: (id: string) => `/grupo/${id}/chat` },
  { key: 'clima',       label: 'Clima',      path: (id: string) => `/grupo/${id}/clima` },
  { key: 'transporte',  label: 'Transporte', path: (id: string) => `/grupo/${id}/transporte` },
  { key: 'feedback',    label: 'Feedback',   path: (id: string) => `/grupo/${id}/feedback` },
];

function GroupTabs() {
  const { grupo, loading, error } = useGroup();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/actividades')) return 'actividades';
    if (path.includes('/itinerario')) return 'itinerario';
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/clima')) return 'clima';
    if (path.includes('/transporte')) return 'transporte';
    if (path.includes('/gastos')) return 'gastos';
    if (path.includes('/feedback')) return 'feedback';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const checkArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Delay to ensure layout is fully computed before measuring scrollWidth
    const timer = setTimeout(checkArrows, 50);
    el.addEventListener('scroll', checkArrows, { passive: true });
    window.addEventListener('resize', checkArrows, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkArrows);
      window.removeEventListener('resize', checkArrows);
    };
  }, [activeTab]);

  const handleScrollLeft = () => scrollRef.current?.scrollBy({ left: -180, behavior: 'smooth' });
  const handleScrollRight = () => scrollRef.current?.scrollBy({ left: 180, behavior: 'smooth' });

  const handleTabClick = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const tabWidth = 180;
    const gap = 4;
    const padding = 8;
    const tabOffset = padding + index * (tabWidth + gap);
    el.scrollTo({ left: tabOffset - (el.clientWidth - tabWidth) / 2, behavior: 'smooth' });
  };

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
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.50) 100%), url(${heroPhoto})`,
      }
    : {
        backgroundImage: 'linear-gradient(135deg, #000000, #0B1E3D)',
      };

  return (
    <div className="group-tabs-container">
      {heroPhoto && (
        <img
          src={heroPhoto}
          alt=""
          style={{ display: "none" }}
          onLoad={() => setPhotoLoaded(true)}
        />
      )}

      {/* Hero */}
      <div
        className={`group-header${photoLoaded ? " group-header--photo" : ""}`}
        style={heroStyle}
      >
        <div className="ts-container">
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

      {/* Tabs */}
      <div className="tabs-container">
        <div className="ts-container">
          <div className="tabs-bar">
            <button className="btn-tab-back" onClick={() => navigate("/dashboard")}>
              ← Mi panel
            </button>
            <div className="tabs-carousel-wrapper">
              <button
                className={`tabs-arrow tabs-arrow--left${!canScrollLeft ? ' tabs-arrow--hidden' : ''}`}
                onClick={handleScrollLeft}
                aria-label="Scroll izquierda"
              >
                ◀
              </button>
              <div className="tabs-scroll-area" ref={scrollRef}>
                <nav className="tabs-nav">
                  {TABS.map((tab, index) => (
                    <Link
                      key={tab.key}
                      to={tab.path(id!)}
                      className={`tab-item${activeTab === tab.key ? ' tab-active' : ''}`}
                      onClick={() => handleTabClick(index)}
                    >
                      <span className="tab-item-icon">{ICONS[tab.key]}</span>
                      <span className="tab-item-label">{tab.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
              <button
                className={`tabs-arrow tabs-arrow--right${!canScrollRight ? ' tabs-arrow--hidden' : ''}`}
                onClick={handleScrollRight}
                aria-label="Scroll derecha"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="tab-content">
        <Outlet />
      </div>
    </div>
  );
}

export default GroupTabs;
