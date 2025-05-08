import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import paisaje from '../assets/paisaje.jpg';

function Home() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-start py-5">
      <h1 className="text-center mb-4">¡Bienvenido a mi página!</h1>

      {user ? (
        <div className="mb-4 text-center">
          <p className="mb-2">Conectado como: <strong>{user.email}</strong></p>
          <button className="btn btn-danger" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <div className="d-flex gap-3 mb-4">
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/register')}>
            Registrarse
          </button>
        </div>
      )}

      <div className="w-75">
        <img
          src={paisaje}
          alt="Paisaje de bienvenida"
          className="img-fluid rounded shadow"
          style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
}

export default Home;
