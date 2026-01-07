import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

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
};

function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

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
      });
    });

    return () => unsub();
  }, [id]);

  const userEmail = auth.currentUser?.email ?? null;
  const userUid = auth.currentUser?.uid ?? null;

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

    if (!date) {
      alert("Selecciona una fecha.");
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
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Itinerario de {grupo.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      <form onSubmit={handleAddItem} className="card p-3 mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Hora (opcional)</label>
            <input
              type="time"
              className="form-control"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Título</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ej: Visitar museo"
            />
          </div>

          <div className="col-12">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalles, punto de encuentro, entradas, etc."
            />
          </div>
        </div>

        <button className="btn btn-primary mt-3" type="submit">
          Añadir al itinerario
        </button>
      </form>

      <h3>Plan por días</h3>

      {itemsSorted.length === 0 ? (
        <p>No hay items aún.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {grouped.map(([day, items]) => (
            <div key={day} className="card p-3">
              <h5 className="mb-3">{new Date(day).toLocaleDateString()}</h5>

              <ul className="list-group">
                {items.map((it) => {
                  const canDelete =
                    (userUid && grupo.createdBy && userUid === grupo.createdBy) ||
                    (userEmail && it.createdBy === userEmail);

                  return (
                    <li key={it.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div style={{ flex: 1 }}>
                          <div className="d-flex align-items-center gap-2">
                            {it.time && (
                              <span className="badge text-bg-secondary">{it.time}</span>
                            )}
                            <strong>{it.title}</strong>
                          </div>

                          {it.notes && <div className="mt-2">{it.notes}</div>}

                          <div className="small text-muted mt-2">
                            Añadido por: {it.createdBy}
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            className="btn btn-outline-danger"
                            type="button"
                            onClick={() => handleDeleteItem(it.id)}
                          >
                            Borrar
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Itinerary;
