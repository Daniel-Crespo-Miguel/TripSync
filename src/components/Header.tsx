import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <div className="logo">
            TS
          </div>
          <div className="logo-text">TripSync</div>
        </div>
        
        <nav>
          <ul className="nav-links">
            <li>
              <a href="/" className="nav-link active">Home</a>
            </li>
            <li>
              <a href="#sobre-web" className="nav-link">Sobre la web</a>
            </li>
            <li>
              <a href="/about" className="nav-link">Sobre mí</a>
            </li>
          </ul>
        </nav>

        <div className="user-actions">
          {user ? (
            <>
              <button 
                className="btn-header btn-secondary-header"
                onClick={() => navigate('/dashboard')}
              >
                Mi panel
              </button>
              <button 
                className="btn-header btn-primary-header"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn-header btn-secondary-header"
                onClick={() => navigate('/login')}
              >
                Iniciar sesión
              </button>
              <button 
                className="btn-header btn-cta-header"
                onClick={() => navigate('/register')}
              >
                Registrarse
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;