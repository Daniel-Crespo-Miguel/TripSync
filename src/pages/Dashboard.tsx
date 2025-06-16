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
  invitados?: string[];
}

function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      setUserId(user.uid);

      const gruposRef = collection(db, "grupos");
      const q = query(gruposRef, where("createdBy", "==", user.uid));
      const snapshot = await getDocs(q);

      const q2 = query(gruposRef, where("invitados", "array-contains", user.email));
      const snapshot2 = await getDocs(q2);

      const data: Grupo[] = [
        ...snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          destination: doc.data().destination,
          startDate: doc.data().startDate,
          endDate: doc.data().endDate,
          invitados: doc.data().invitados || [],
        })),
        ...snapshot2.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          destination: doc.data().destination,
          startDate: doc.data().startDate,
          endDate: doc.data().endDate,
          invitados: doc.data().invitados || [],
        }))
      ];

      setGrupos(data);
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="container mt-5">
      <h2>Panel de Usuario</h2>

      <button
        className="btn btn-success mb-4"
        onClick={() => navigate("/crear-viaje")}
      >
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
    </div>
  );
}

export default Dashboard;
