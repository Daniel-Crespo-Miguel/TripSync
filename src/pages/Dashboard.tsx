import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Grupo {
  id: string;
  name: string;
  destination: string;
  startDate: { seconds: number; nanoseconds: number };
  endDate: { seconds: number; nanoseconds: number };
}

function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.uid);

      const gruposRef = collection(db, 'grupos');
      const q = query(gruposRef, where('createdBy', '==', user.uid));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Grupo[];

      setGrupos(data);
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="container mt-5">
      <h2>Panel de Usuario</h2>

      <button className="btn btn-success mb-4" onClick={() => navigate('/crear-viaje')}>
        Crear nuevo viaje
      </button>

      <h4>Mis grupos de viaje</h4>
      {grupos.length === 0 ? (
        <p>No tienes grupos creados todavía.</p>
      ) : (
        <ul className="list-group">
          {grupos.map((grupo) => (
            <li key={grupo.id} className="list-group-item">
              <strong>{grupo.name}</strong> - {grupo.destination} (
              {new Date(grupo.startDate.seconds * 1000).toLocaleDateString()} a{' '}
              {new Date(grupo.endDate.seconds * 1000).toLocaleDateString()})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
