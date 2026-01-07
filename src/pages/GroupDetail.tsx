import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [nuevoInvitado, setNuevoInvitado] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchGrupo = async () => {
      if (!id) return;
      const docRef = doc(db, "grupos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setGrupo(docSnap.data());
      } else {
        navigate("/");
      }
    };

    fetchGrupo();
  }, [id, navigate]);

  const handleAddInvitado = async () => {
    if (!id || !nuevoInvitado.trim()) return;

    const grupoRef = doc(db, "grupos", id);
    await updateDoc(grupoRef, {
      invitados: arrayUnion(nuevoInvitado.trim()),
    });

    setGrupo((prev: any) => ({
      ...prev,
      invitados: [...(prev.invitados || []), nuevoInvitado.trim()],
    }));

    setNuevoInvitado("");
  };

  if (!grupo || !user) {
    return <div className="container mt-5">Cargando grupo...</div>;
  }

  const esCreador = grupo.createdBy === user.uid;

  return (
    <div className="container mt-5">
      <h2>{grupo.name}</h2>
      <p>
        <strong>Destino:</strong> {grupo.destination}
      </p>
      <p>
        <strong>Fecha:</strong>{" "}
        {new Date(grupo.startDate.seconds * 1000).toLocaleDateString()} a{" "}
        {new Date(grupo.endDate.seconds * 1000).toLocaleDateString()}
      </p>
      <p>
        <strong>Creador:</strong> {grupo.createdByEmail || "Desconocido"}
      </p>

      <h5>Invitados:</h5>
      <ul>
        {grupo.invitados && grupo.invitados.length > 0 ? (
          grupo.invitados.map((email: string, index: number) => (
            <li key={index}>{email}</li>
          ))
        ) : (
          <li>No hay invitados.</li>
        )}
      </ul>

      {esCreador && (
        <div className="mt-4">
          <h6>Añadir nuevo invitado</h6>
          <div className="d-flex gap-2">
            <input
              type="email"
              className="form-control"
              placeholder="Correo del invitado"
              value={nuevoInvitado}
              onChange={(e) => setNuevoInvitado(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleAddInvitado}>
              Añadir
            </button>
          </div>
        </div>
      )}
      <button
        className="btn btn-warning mt-4 ms-2"
        onClick={() => navigate(`/grupo/${id}/actividades`)}
      >
        Ver Actividades
      </button>

      <button
        className="btn btn-secondary mt-4"
        onClick={() => navigate("/dashboard")}
      >
        Volver al Panel de Usuario
      </button>

      <button
        className="btn btn-info mt-4"
        onClick={() => navigate(`/grupo/${id}/gastos`)}
      >
        Ver Gastos
      </button>
    </div>
  );
}

export default GroupDetail;
