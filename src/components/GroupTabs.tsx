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

  return (
    <div className="group-tabs-container">
      {/* Header del viaje */}
      <div className="group-header">
        <div className="container">
          <div className="group-header-content">
            <div className="group-title-section">
              <h1 className="group-title">{grupo.name}</h1>
              <div className="group-meta">
                <span className="group-creator">Creado por: {grupo.createdByEmail}</span>
              </div>
            </div>
            
            <div className="group-info-grid">
              <div className="group-info-card">
                <div className="info-label">Destino</div>
                <div className="info-value">{grupo.destination}</div>
              </div>
              
              <div className="group-info-card">
                <div className="info-label">Fechas</div>
                <div className="info-value">{fechaInicio} - {fechaFin}</div>
              </div>
              
              <div className="group-info-card">
                <div className="info-label">Participantes</div>
                <div className="info-value">{grupo.invitados.length} viajeros</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Tabs */}
      <div className="tabs-container">
        <div className="container">
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

      {/* Contenido de la tab activa - usando Outlet para renderizar el contenido de cada ruta */}
      <div className="tab-content">
        <div className="container">
          <Outlet />
        </div>
      </div>

      {/* Botón Volver al panel */}
      <div className="container">
        <div className="actions-bar">
          <button
            className="btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            Volver al panel
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupTabs;
