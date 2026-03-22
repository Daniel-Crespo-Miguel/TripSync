import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useGroup } from "../contexts/GroupContext";
import AIItineraryPanel from "../components/AIItineraryPanel";
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
    <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '90%', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h5 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>Editar actividad</h5>
          <button className="btn-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', padding: '0.25rem', borderRadius: '50%', transition: 'all 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'} onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>×</button>
        </div>
        <div className="modal-body">
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Fecha</label>
            <input type="date" className="form-control" value={date} onChange={(e) => onDateChange(e.target.value)} min={minDate} max={maxDate} required style={{ borderRadius: '8px', border: '2px solid #E5E7EB', padding: '0.75rem 1rem', fontSize: '1rem', transition: 'all 0.3s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'} />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Hora (opcional)</label>
            <input type="time" className="form-control" value={time} onChange={(e) => onTimeChange(e.target.value)} style={{ borderRadius: '8px', border: '2px solid #E5E7EB', padding: '0.75rem 1rem', fontSize: '1rem', transition: 'all 0.3s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'} />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Título</label>
            <input className="form-control" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="Ej: Visitar museo" style={{ borderRadius: '8px', border: '2px solid #E5E7EB', padding: '0.75rem 1rem', fontSize: '1rem', transition: 'all 0.3s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'} />
          </div>
          <div className="mb-4">
            <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Notas (opcional)</label>
            <textarea className="form-control" value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} placeholder="Detalles, punto de encuentro, entradas, etc." style={{ borderRadius: '8px', border: '2px solid #E5E7EB', padding: '0.75rem 1rem', fontSize: '1rem', transition: 'all 0.3s ease', resize: 'vertical' }} onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'} onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'} />
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'white', color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-color)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave} style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', color: 'white', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', backgroundImage: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { grupo, tramoActivo } = useGroup();

  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const userEmail = auth.currentUser?.email ?? null;
  const userUid = auth.currentUser?.uid ?? null;

  const tripMinDate = tramoActivo?.startDate
    ? new Date(tramoActivo.startDate.seconds * 1000).toISOString().split("T")[0]
    : grupo?.startDate
    ? new Date(grupo.startDate.seconds * 1000).toISOString().split("T")[0]
    : undefined;

  const tripMaxDate = tramoActivo?.endDate
    ? new Date(tramoActivo.endDate.seconds * 1000).toISOString().split("T")[0]
    : grupo?.endDate
    ? new Date(grupo.endDate.seconds * 1000).toISOString().split("T")[0]
    : undefined;

  // Subscribe to itinerario subcollection for the active tramo
  useEffect(() => {
    if (!id || !tramoActivo?.id) return;

    const q = query(
      collection(db, "grupos", id, "tramos", tramoActivo.id, "itinerario"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItineraryItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ItineraryItem)));
    });

    return () => unsub();
  }, [id, tramoActivo?.id]);

  const itemsSorted = useMemo(() => {
    return itineraryItems.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const ta = a.time ?? "";
      const tb = b.time ?? "";
      if (ta !== tb) return ta.localeCompare(tb);
      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    });
  }, [itineraryItems]);

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
    if (!id || !tramoActivo?.id) return;

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

    await addDoc(collection(db, "grupos", id, "tramos", tramoActivo.id, "itinerario"), {
      date,
      time: time || null,
      title: title.trim(),
      notes: notes.trim() || null,
      createdBy: email,
      createdAt: new Date().toISOString(),
    });

    setDate("");
    setTime("");
    setTitle("");
    setNotes("");
  };

  const handleEditItem = (item: ItineraryItem) => {
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
    if (!id || !tramoActivo?.id || !editingItem) return;

    const email = auth.currentUser?.email;
    if (!email) return;

    if (!editTitle.trim()) {
      alert("Escribe un título.");
      return;
    }

    await updateDoc(
      doc(db, "grupos", id, "tramos", tramoActivo.id, "itinerario", editingItem.id),
      {
        date: editDate,
        time: editTime || null,
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
      }
    );

    setShowEditModal(false);
    setEditingItem(null);
    setEditDate("");
    setEditTime("");
    setEditTitle("");
    setEditNotes("");
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id || !tramoActivo?.id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para borrar items del itinerario.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const item = itineraryItems.find((it) => it.id === itemId);
    if (!item) return;

    const isGroupOwner = userUid && grupo.createdBy && userUid === grupo.createdBy;
    const isAuthor = item.createdBy === email;

    if (!isGroupOwner && !isAuthor) {
      alert("Solo el creador del grupo o el autor puede borrar este item.");
      return;
    }

    const ok = confirm("¿Seguro que quieres borrar este item del itinerario?");
    if (!ok) return;

    await deleteDoc(doc(db, "grupos", id, "tramos", tramoActivo.id, "itinerario", itemId));
  };

  if (!grupo || !tramoActivo) {
    return (
      <div className="ts-loading-block">
        <span className="ts-spinner" />
        Cargando itinerario...
      </div>
    );
  }

  const destination = tramoActivo?.destination ?? grupo.destination ?? "";

  return (
    <div className="itinerary-page">
      <div className="itinerary-header">
        <h1 className="itinerary-title">Itinerario del viaje</h1>
        <p className="itinerary-subtitle">Organiza las actividades por días y horas</p>
      </div>

      {userEmail && (
        <AIItineraryPanel
          groupId={id!}
          destination={destination}
          userEmail={userEmail}
          participantCount={(grupo.invitados?.length ?? 0) + 1}
          existingItinerary={itineraryItems.map((i) => i.title)}
          startDate={tramoActivo?.startDate ?? grupo.startDate}
          endDate={tramoActivo?.endDate ?? grupo.endDate}
        />
      )}

      <form onSubmit={handleAddItem} className="itinerary-form-card">
        <div className="form-header">
          <h3 className="form-title">Añadir actividad al día</h3>
          <p className="form-subtitle">Organiza tu planificación diaria</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} min={tripMinDate} max={tripMaxDate} required />
          </div>

          <div className="form-group">
            <label className="form-label">Hora (opcional)</label>
            <input type="time" className="form-input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Título</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Visitar museo" />
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">Notas (opcional)</label>
            <textarea className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Detalles, punto de encuentro, entradas, etc." />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-submit" type="submit">Añadir al itinerario</button>
        </div>
      </form>

      <div className="itinerary-main">
        <div className="itinerary-section-header">
          <h2 className="section-title">Plan por días</h2>
          <p className="section-subtitle">Este es el plan definitivo del viaje organizado por días y horas</p>
        </div>

        {itemsSorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h5 className="empty-title">Aún no hay actividades en el itinerario</h5>
            <p className="empty-subtitle">Empieza añadiendo una actividad 👇</p>
          </div>
        ) : (
          <div className="timeline-container">
            {grouped.map(([day, items], dayIndex) => (
              <div key={day} className="itinerary-day">
                <div className="day-header">
                  <div className="day-date">
                    <span className="day-number-badge">{dayIndex + 1}</span>
                    <span className="date-text">
                      {(() => { const [y, m, d] = day.substring(0, 10).split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-ES'); })()}
                    </span>
                  </div>
                  <span className="weekday-text">
                    {(() => { const [y, m, d] = day.substring(0, 10).split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long' }); })()}
                  </span>
                </div>

                <div className="agenda-list">
                  {items.length === 0 ? (
                    <div className="agenda-empty-day">Sin actividades programadas</div>
                  ) : (
                    items.map((it) => {
                      const canEdit =
                        (userUid && grupo.createdBy && userUid === grupo.createdBy) ||
                        (userEmail && it.createdBy === userEmail);
                      const canDelete = canEdit;

                      return (
                        <div key={it.id} className="agenda-row">
                          <div className={`agenda-time${!it.time ? ' agenda-time--empty' : ''}`}>
                            {it.time ?? "--:--"}
                          </div>
                          <div className="agenda-divider" />
                          <div className="agenda-body">
                            <span className="agenda-title">{it.title}</span>
                            {it.notes && <p className="agenda-notes">{it.notes}</p>}
                          </div>
                          {(canEdit || canDelete) && (
                            <div className="agenda-actions">
                              {canEdit && (
                                <button className="agenda-btn" onClick={() => handleEditItem(it)} title="Editar">✏️</button>
                              )}
                              {canDelete && (
                                <button className="agenda-btn agenda-btn--delete" onClick={() => handleDeleteItem(it.id)} title="Eliminar">🗑️</button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
