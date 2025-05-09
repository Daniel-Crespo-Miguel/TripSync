import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="container mt-5">
      <h2>Panel de Usuario</h2>
      <p>Bienvenido a tu panel personal. Aquí podrás gestionar tus viajes y grupos.</p>
    </div>
  );
}

export default Dashboard;
