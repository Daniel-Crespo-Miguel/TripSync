import { useState } from "react";
import { useGroup } from "../contexts/GroupContext";

function GroupDetail() {
  const { grupo, user, handleAddInvitado } = useGroup();
  const [nuevoInvitado, setNuevoInvitado] = useState("");

  if (!grupo || !user) {
    return (
      <div className="overview-content">
        <div className="loading-spinner">Cargando información del grupo...</div>
      </div>
    );
  }

  const esCreador = grupo.createdBy === user.uid;
  const fechaInicio = new Date(grupo.startDate.seconds * 1000).toLocaleDateString();
  const fechaFin = new Date(grupo.endDate.seconds * 1000).toLocaleDateString();

  const handleAddInvitadoLocal = async () => {
    if (!nuevoInvitado.trim()) return;

    try {
      await handleAddInvitado(nuevoInvitado.trim());
      setNuevoInvitado("");
    } catch (error) {
      console.error("Error adding invitado:", error);
    }
  };

  return (
    <div className="overview-content">
      {/* Información del viaje */}
      <div className="section-card">
        <h3 className="section-title">Información del viaje</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Nombre del viaje:</span>
            <span className="info-value">{grupo.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Destino:</span>
            <span className="info-value">{grupo.destination}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Fecha de inicio:</span>
            <span className="info-value">{fechaInicio}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Fecha de fin:</span>
            <span className="info-value">{fechaFin}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Creador:</span>
            <span className="info-value">{grupo.createdByEmail}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Participantes:</span>
            <span className="info-value">{grupo.invitados.length} viajeros</span>
          </div>
        </div>
      </div>

      {/* Invitados */}
      <div className="section-card">
        <h3 className="section-title">Invitados</h3>
        <div className="invitados-list">
          {grupo.invitados && grupo.invitados.length > 0 ? (
            grupo.invitados.map((email, index) => (
              <div key={index} className="invitado-chip">
                <span className="invitado-avatar">{email.charAt(0).toUpperCase()}</span>
                <span className="invitado-email">{email}</span>
              </div>
            ))
          ) : (
            <div className="no-invitados">No hay invitados.</div>
          )}
        </div>

        {esCreador && (
          <div className="add-invitado-section">
            <h4 className="add-invitado-title">Añadir nuevo invitado</h4>
            <div className="add-invitado-form">
              <input
                type="email"
                className="form-input"
                placeholder="Correo del invitado"
                value={nuevoInvitado}
                onChange={(e) => setNuevoInvitado(e.target.value)}
              />
              <button className="btn-primary" onClick={handleAddInvitadoLocal}>
                Añadir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetail;
