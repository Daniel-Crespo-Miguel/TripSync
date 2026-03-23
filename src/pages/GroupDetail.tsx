import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useGroup } from "../contexts/GroupContext";

function GroupDetail() {
  const { grupo, user, handleAddInvitado } = useGroup();
  const [nuevoInvitado, setNuevoInvitado] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

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

  const handleShareLink = async () => {
    if (!grupo) return;
    setGeneratingLink(true);

    try {
      let token = grupo.inviteToken;

      if (!token) {
        token = crypto.randomUUID();
        await updateDoc(doc(db, "grupos", grupo.id), { inviteToken: token });
      }

      const url = `${window.location.origin}/unirse/${token}`;
      setShareUrl(url);
    } catch (err) {
      console.error("Error generating invite link:", err);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(`¡Únete a nuestro viaje "${grupo?.name}" en TripSync! ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

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

            <div className="share-link-section">
              <h4 className="add-invitado-title">Compartir enlace de invitación</h4>

              {!shareUrl ? (
                <button
                  className="btn-primary"
                  onClick={handleShareLink}
                  disabled={generatingLink}
                >
                  {generatingLink ? "Generando..." : "Compartir enlace"}
                </button>
              ) : (
                <div className="share-link-box">
                  <input
                    type="text"
                    className="form-input share-link-input"
                    value={shareUrl}
                    readOnly
                  />
                  <div className="share-link-actions">
                    <button className="btn-primary" onClick={handleCopyLink}>
                      {copied ? "¡Copiado!" : "Copiar enlace"}
                    </button>
                    <button className="btn-whatsapp" onClick={handleWhatsApp}>
                      WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetail;
