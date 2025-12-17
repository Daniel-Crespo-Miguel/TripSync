import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Grupo {
  id: string;
  name: string;
  destination: string;
  startDate: { seconds: number; nanoseconds: number };
  endDate: { seconds: number; nanoseconds: number };
}

function Dashboard() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      const gruposRef = collection(db, "grupos");

      const qCreated = query(gruposRef, where("createdBy", "==", user.uid));
      const snapshotCreated = await getDocs(qCreated);

      const qInvited = query(gruposRef, where("invitados", "array-contains", user.email));
      const snapshotInvited = await getDocs(qInvited);

      const items: Grupo[] = [
        ...snapshotCreated.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          destination: d.data().destination,
          startDate: d.data().startDate,
          endDate: d.data().endDate,
        })),
        ...snapshotInvited.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          destination: d.data().destination,
          startDate: d.data().startDate,
          endDate: d.data().endDate,
        })),
      ];

      const unique = Array.from(new Map(items.map((g) => [g.id, g])).values());

      setGrupos(unique);
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="container mt-5">
      <h2>Panel de Usuario</h2>

      <button className="btn btn-success mb-4" onClick={() => navigate("/crear-viaje")}>
        Crear nuevo viaje
      </button>

      <h4>Mis grupos de viaje</h4>
      {grupos.length === 0 ? (
        <p>No tienes grupos creados ni en los que estás invitado.</p>
      ) : (
        <ul className="list-group">
          {grupos.map((grupo) => (
            <li
              key={grupo.id}
              className="list-group-item"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/grupo/${grupo.id}`)}
            >
              <strong>{grupo.name}</strong> - {grupo.destination} (
              {new Date(grupo.startDate.seconds * 1000).toLocaleDateString()} a{" "}
              {new Date(grupo.endDate.seconds * 1000).toLocaleDateString()})
            </li>
          ))}
        </ul>
      )}

      <button className="btn btn-secondary mt-4" onClick={() => navigate("/")}>
        Volver a la Página de Inicio
      </button>
    </div>
  );
}

export default Dashboard;
