import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import "../styles/itinerary.css";

type ItineraryItem = {
  id: string;
  date: string; 
  time?: string; 
  title: string;
  notes?: string;
  createdBy: string; 
  createdAt: string; 
};

type Grupo = {
  name: string;
  destination?: string;
  itinerary: ItineraryItem[];
  createdBy: string;
  startDate?: { seconds: number };
  endDate?: { seconds: number };
};

// Modal para editar actividad
function EditActivityModal({
  show,
  onClose,
  onSave,
  item,
  date,
  time,
  title,
  notes,
  onDateChange,
  onTimeChange,
  onTitleChange,
  onNotesChange,
  minDate,
  maxDate,
}: {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  item: ItineraryItem | null;
  date: string;
  time: string;
  title: string;
  notes: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTitleChange: (title: string) => void;
  onNotesChange: (notes: string) => void;
  minDate?: string;
  maxDate?: string;
}) {
  if (!show || !item) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h5 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            Editar actividad
          </h5>
          <button 
            className="btn-close" 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.25rem',
              borderRadius: '50%',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Fecha
            </label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              min={minDate}
              max={maxDate}
              required
              style={{
                borderRadius: '8px',
                border: '2px solid #E5E7EB',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Hora (opcional)
            </label>
            <input
              type="time"
              className="form-control"
              value={time}
              onChange={(e) => onTimeChange(e.target.value)}
              style={{
                borderRadius: '8px',
                border: '2px solid #E5E7EB',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Título
            </label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej: Visitar museo"
              style={{
                borderRadius: '8px',
                border: '2px solid #E5E7EB',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Notas (opcional)
            </label>
            <textarea
              className="form-control"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              placeholder="Detalles, punto de encuentro, entradas, etc."
              style={{
                borderRadius: '8px',
                border: '2px solid #E5E7EB',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                resize: 'vertical'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>
        <div className="modal-footer" style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-color)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSave}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundImage: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  // Formulario para añadir nueva actividad
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    const fetchGrupo = async () => {
      const ref = doc(db, "grupos", id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        navigate("/");
        return;
      }

      const data = snap.data() as any;
      setGrupo({
        name: data.name ?? "Grupo",
        destination: data.destination,
        itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
        createdBy: data.createdBy ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
      });
    };

    fetchGrupo();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "grupos", id), (snap) => {
      if (!snap.exists()) return;

      const data = snap.data() as any;
      setGrupo({
        name: data.name ?? "Grupo",
        destination: data.destination,
        itinerary: Array.isArray(data.itinerary) ? data.itinerary : [],
        createdBy: data.createdBy ?? "",
        startDate: data.startDate,
        endDate: data.endDate,
      });
    });

    return () => unsub();
  }, [id]);

  const userEmail = auth.currentUser?.email ?? null;
  const userUid = auth.currentUser?.uid ?? null;

  const tripMinDate = grupo?.startDate
    ? new Date(grupo.startDate.seconds * 1000).toISOString().split("T")[0]
    : undefined;
  const tripMaxDate = grupo?.endDate
    ? new Date(grupo.endDate.seconds * 1000).toISOString().split("T")[0]
    : undefined;

  const itemsSorted = useMemo(() => {
    const list = grupo?.itinerary ?? [];
    return list
      .slice()
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        const ta = a.time ?? "";
        const tb = b.time ?? "";
        if (ta !== tb) return ta.localeCompare(tb);
        return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      });
  }, [grupo?.itinerary]);

  const grouped = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();
    for (const item of itemsSorted) {
      const key = item.date || "Sin fecha";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [itemsSorted]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para añadir items al itinerario.");
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      alert("Escribe un título.");
      return;
    }

    const newItem: ItineraryItem = {
      id: crypto.randomUUID(),
      date,
      time: time || undefined,
      title: title.trim(),
      notes: notes.trim() || undefined,
      createdBy: email,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, "grupos", id), {
      itinerary: arrayUnion(newItem),
    });

    setDate("");
    setTime("");
    setTitle("");
    setNotes("");
  };

  const handleEditItem = (item: ItineraryItem) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para editar items del itinerario.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const isGroupOwner = userUid && grupo.createdBy && userUid === grupo.createdBy;
    const isAuthor = item.createdBy === email;

    if (!isGroupOwner && !isAuthor) {
      alert("Solo el creador del grupo o el autor puede editar este item.");
      return;
    }

    setEditingItem(item);
    setEditDate(item.date);
    setEditTime(item.time || "");
    setEditTitle(item.title);
    setEditNotes(item.notes || "");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !editingItem) return;

    const email = auth.currentUser?.email;
    if (!email) return;

    if (!editTitle.trim()) {
      alert("Escribe un título.");
      return;
    }

    const updatedItem: ItineraryItem = {
      ...editingItem,
      date: editDate,
      time: editTime || undefined,
      title: editTitle.trim(),
      notes: editNotes.trim() || undefined,
    };

    const updated = (grupo?.itinerary || []).map((it) => 
      it.id === editingItem.id ? updatedItem : it
    );

    await updateDoc(doc(db, "grupos", id), {
      itinerary: updated,
    });

    setShowEditModal(false);
    setEditingItem(null);
    setEditDate("");
    setEditTime("");
    setEditTitle("");
    setEditNotes("");
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para borrar items del itinerario.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const item = (grupo.itinerary ?? []).find((it) => it.id === itemId);
    if (!item) return;

    const isGroupOwner = userUid && grupo.createdBy && userUid === grupo.createdBy;
    const isAuthor = item.createdBy === email;

    if (!isGroupOwner && !isAuthor) {
      alert("Solo el creador del grupo o el autor puede borrar este item.");
      return;
    }

    const ok = confirm("¿Seguro que quieres borrar este item del itinerario?");
    if (!ok) return;

    const updated = (grupo.itinerary ?? []).filter((it) => it.id !== itemId);

    await updateDoc(doc(db, "grupos", id), {
      itinerary: updated,
    });
  };

  if (!grupo) {
    return <div className="container mt-5">Cargando itinerario...</div>;
  }

  return (
    <div className="itinerary-page">
      {/* Cabecera de la página */}
      <div className="itinerary-header">
        <h1 className="itinerary-title">Itinerario del viaje</h1>
        <p className="itinerary-subtitle">Organiza las actividades por días y horas</p>
      </div>

      {/* Formulario para añadir actividad al itinerario */}
      <form onSubmit={handleAddItem} className="itinerary-form-card">
        <div className="form-header">
          <h3 className="form-title">Añadir actividad al día</h3>
          <p className="form-subtitle">Organiza tu planificación diaria</p>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={tripMinDate}
              max={tripMaxDate}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hora (opcional)</label>
            <input
              type="time"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Título</label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ej: Visitar museo"
            />
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Detalles, punto de encuentro, entradas, etc."
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-submit" type="submit">
            Añadir al itinerario
          </button>
        </div>
      </form>

      {/* Vista principal: Itinerario por días */}
      <div className="itinerary-main">
        <div className="itinerary-section-header">
          <h2 className="section-title">Plan por días</h2>
          <p className="section-subtitle">
            Este es el plan definitivo del viaje organizado por días y horas
          </p>
        </div>

        {itemsSorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h5 className="empty-title">Aún no hay actividades en el itinerario</h5>
            <p className="empty-subtitle">Empieza añadiendo una actividad 👇</p>
          </div>
        ) : (
          <div className="timeline-container">
            {grouped.map(([day, items]) => (
              <div key={day} className="itinerary-day">
                <div className="day-header">
                  <div className="day-date">
                    <span className="date-icon">📅</span>
                    <span className="date-text">{(() => { const [y,m,d] = day.substring(0,10).split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('es-ES'); })()}</span>
                  </div>
                  <span className="weekday-text">
                    {(() => { const [y,m,d] = day.substring(0,10).split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('es-ES', { weekday: 'long' }); })()}
                  </span>
                </div>

                <div className="timeline">
                  {items.map((it) => {
                    const canEdit =
                      (userUid && grupo.createdBy && userUid === grupo.createdBy) ||
                      (userEmail && it.createdBy === userEmail);
                    const canDelete = canEdit;

                    return (
                      <div key={it.id} className="timeline-item">
                        <div className="timeline-marker">
                          <div className="timeline-dot"></div>
                          <div className="timeline-line"></div>
                        </div>
                        <div className="timeline-content">
                          <div className="activity-card">
                            <div className="activity-header">
                              <div className="activity-time">
                                {it.time && (
                                  <span className="time-badge">⏰ {it.time}</span>
                                )}
                                <span className="activity-title">{it.title}</span>
                              </div>
                              <div className="activity-actions">
                                {canEdit && (
                                  <button
                                    className="action-btn edit-btn"
                                    onClick={() => handleEditItem(it)}
                                    title="Editar"
                                  >
                                    Editar
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    className="action-btn delete-btn"
                                    onClick={() => handleDeleteItem(it.id)}
                                    title="Eliminar del itinerario"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {it.notes && (
                              <div className="activity-notes">
                                {it.notes}
                              </div>
                            )}

                            <div className="activity-meta">
                              <span className="creator-badge">
                                Añadido por: {it.createdBy.split('@')[0]}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para editar actividad */}
      <EditActivityModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
          setEditDate("");
          setEditTime("");
          setEditTitle("");
          setEditNotes("");
        }}
        onSave={handleSaveEdit}
        item={editingItem}
        date={editDate}
        time={editTime}
        title={editTitle}
        notes={editNotes}
        onDateChange={setEditDate}
        onTimeChange={setEditTime}
        onTitleChange={setEditTitle}
        onNotesChange={setEditNotes}
        minDate={tripMinDate}
        maxDate={tripMaxDate}
      />
    </div>
  );
}

export default Itinerary;
