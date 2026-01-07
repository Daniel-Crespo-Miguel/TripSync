import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

type Activity = {
  id: string;
  title: string;
  description: string;
  date?: string;
  location?: string;
  createdBy: string; 
  createdAt: string; 
  votes: string[]; 
};

type Grupo = {
  name: string;
  invitados: string[];
  activities: Activity[];
  createdBy: string; 
};

function Activities() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

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
        invitados: Array.isArray(data.invitados) ? data.invitados : [],
        activities: Array.isArray(data.activities) ? data.activities : [],
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
        invitados: Array.isArray(data.invitados) ? data.invitados : [],
        activities: Array.isArray(data.activities) ? data.activities : [],
        createdBy: data.createdBy ?? "",
      });
    });

    return () => unsub();
  }, [id]);

  const userEmail = auth.currentUser?.email ?? null;
  const userUid = auth.currentUser?.uid ?? null;

  const activitiesSorted = useMemo(() => {
    const list = grupo?.activities ?? [];
    return list.slice().sort((a, b) => {
      const va = a.votes?.length ?? 0;
      const vb = b.votes?.length ?? 0;
      if (vb !== va) return vb - va;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  }, [grupo?.activities]);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para crear actividades.");
      navigate("/login");
      return;
    }

    if (!title.trim()) {
      alert("Pon un título.");
      return;
    }

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      date: date ? new Date(date).toISOString() : undefined,
      location: location.trim() || undefined,
      createdBy: email,
      createdAt: new Date().toISOString(),
      votes: [],
    };

    await updateDoc(doc(db, "grupos", id), {
      activities: arrayUnion(newActivity),
    });

    setTitle("");
    setDescription("");
    setDate("");
    setLocation("");
  };

  const handleToggleVote = async (activityId: string) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para votar.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const current = grupo.activities ?? [];
    const updated = current.map((a) => {
      if (a.id !== activityId) return a;

      const votes = Array.isArray(a.votes) ? a.votes : [];
      const hasVoted = votes.includes(email);

      return {
        ...a,
        votes: hasVoted ? votes.filter((v) => v !== email) : [...votes, email],
      };
    });

    await updateDoc(doc(db, "grupos", id), {
      activities: updated,
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!id) return;

    const email = auth.currentUser?.email;
    if (!email) {
      alert("Necesitas iniciar sesión para borrar actividades.");
      navigate("/login");
      return;
    }

    if (!grupo) return;

    const activity = (grupo.activities ?? []).find((a) => a.id === activityId);
    if (!activity) return;

    const isGroupOwner = userUid && grupo.createdBy && userUid === grupo.createdBy;
    const isAuthor = activity.createdBy === email;

    if (!isGroupOwner && !isAuthor) {
      alert("Solo el creador del grupo o el autor puede borrar esta actividad.");
      return;
    }

    const ok = confirm("¿Seguro que quieres borrar esta actividad?");
    if (!ok) return;

    const updated = (grupo.activities ?? []).filter((a) => a.id !== activityId);

    await updateDoc(doc(db, "grupos", id), {
      activities: updated,
    });
  };

  if (!grupo) {
    return <div className="container mt-5">Cargando actividades...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Actividades de {grupo.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      <form onSubmit={handleAddActivity} className="card p-3 mb-4">
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Fecha (opcional)</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Ubicación (opcional)</label>
            <input
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Plaza de España"
            />
          </div>
        </div>

        <button className="btn btn-primary" type="submit">
          Añadir actividad
        </button>
      </form>

      <h3>Lista de actividades</h3>

      {activitiesSorted.length === 0 ? (
        <p>No hay actividades aún.</p>
      ) : (
        <ul className="list-group">
          {activitiesSorted.map((a) => {
            const votesCount = a.votes?.length ?? 0;
            const hasVoted = userEmail ? (a.votes ?? []).includes(userEmail) : false;

            const canDelete =
              (userUid && grupo.createdBy && userUid === grupo.createdBy) ||
              (userEmail && a.createdBy === userEmail);

            return (
              <li key={a.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-start gap-3">
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2">
                      <strong>{a.title}</strong>
                      <span className="badge text-bg-secondary">{votesCount} votos</span>
                    </div>

                    {a.location && <div className="small">📍 {a.location}</div>}
                    {a.date && (
                      <div className="small">📅 {new Date(a.date).toLocaleDateString()}</div>
                    )}
                    {a.description && <div className="mt-2">{a.description}</div>}

                    <div className="small text-muted mt-2">Propuesta por: {a.createdBy}</div>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <button
                      className={`btn ${hasVoted ? "btn-success" : "btn-outline-success"}`}
                      onClick={() => handleToggleVote(a.id)}
                      type="button"
                    >
                      {hasVoted ? "Apuntado ✓" : "¡Me apunto!"}
                    </button>

                    {canDelete && (
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteActivity(a.id)}
                        type="button"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Activities;
