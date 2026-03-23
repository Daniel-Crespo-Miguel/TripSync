import { useRef, useState } from "react";
import { useGroup } from "../contexts/GroupContext";
import { useDocuments, TripDocument } from "../hooks/useDocuments";
import "../styles/documents.css";

const TYPE_ICON: Record<TripDocument["type"], string> = {
  vuelo:       "✈️",
  hotel:       "🏨",
  tren:        "🚆",
  entrada:     "🎭",
  restaurante: "🍽️",
  otro:        "📄",
};

function Documents() {
  const { grupo, user } = useGroup();
  const groupId = grupo?.id ?? "";
  const userEmail = user?.email ?? "";

  const { documents, loading, uploading, error, uploadDocument, deleteDocument } =
    useDocuments(groupId, userEmail);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0] ?? null;
    handleFileChange(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    await uploadDocument(selectedFile);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatDateTime = (date: string, time: string | null) => {
    if (!date) return "Fecha no detectada";
    const d = new Date(date + "T00:00:00");
    if (isNaN(d.getTime())) return "Fecha no detectada";
    const formatted = d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return time ? `${formatted} · ${time}` : formatted;
  };

  return (
    <div className="documents-container">
      {/* Upload section */}
      <div className="doc-upload-card">
        <h2 className="doc-upload-title">📄 Subir documento de reserva</h2>
        <p className="doc-upload-subtitle">
          Sube confirmaciones de vuelo, hotel, tren, entradas o restaurantes.
          La IA extraerá la información automáticamente.
        </p>

        <div
          className={`doc-drop-zone${dragOver ? " doc-drop-zone--active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <span className="doc-drop-icon">📂</span>
          <p className="doc-drop-text">
            Arrastra tu PDF aquí o <strong>haz clic para seleccionar</strong>
          </p>
        </div>

        {selectedFile && (
          <div className="doc-selected-file">
            📎 {selectedFile.name}
          </div>
        )}

        <button
          className="btn-upload"
          onClick={handleSubmit}
          disabled={!selectedFile || uploading}
        >
          {uploading ? "Analizando con IA..." : "✨ Subir y analizar con IA"}
        </button>

        {uploading && (
          <div className="doc-uploading-msg">
            <span>⏳</span> Extrayendo información del documento, un momento...
          </div>
        )}

        {error && <div className="doc-error">⚠️ {error}</div>}
      </div>

      {/* Timeline section */}
      <div className="doc-timeline-section">
        <h2 className="doc-timeline-title">📋 Documentos del viaje</h2>

        {loading ? (
          <div className="doc-empty">Cargando documentos...</div>
        ) : documents.length === 0 ? (
          <div className="doc-empty">
            Aún no hay documentos. ¡Sube tu primera reserva!
          </div>
        ) : (
          <div className="doc-timeline">
            {documents.map((doc) => (
              <div key={doc.id} className="doc-item">
                <span className="doc-item-icon">{TYPE_ICON[doc.type]}</span>

                <div className="doc-item-body">
                  <div className="doc-item-header">
                    <h3 className="doc-item-title">{doc.title}</h3>
                    <span className={`doc-type-pill doc-type-pill--${doc.type}`}>
                      {doc.type}
                    </span>
                  </div>
                  {doc.provider && <div className="doc-item-provider">{doc.provider}</div>}
                  <div className="doc-item-datetime">
                    {formatDateTime(doc.date, doc.time)}
                  </div>
                  {doc.details && <p className="doc-item-details">{doc.details}</p>}
                </div>

                <div className="doc-item-actions">
                  <a
                    href={doc.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view-pdf"
                  >
                    Ver PDF
                  </a>
                  <button
                    className="btn-delete-doc"
                    title="Eliminar documento"
                    onClick={() => {
                      if (window.confirm("¿Eliminar este documento?")) {
                        deleteDocument(doc.id);
                      }
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Documents;
