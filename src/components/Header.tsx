import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import logoTripSync from '../assets/Logo.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleNavClick = (sectionId: string | null) => {
    const scrollTo = () => {
      if (sectionId === null) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    if (location.pathname === '/') {
      scrollTo();
    } else {
      navigate('/');
      setTimeout(scrollTo, 100);
    }
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className={`header${isAuthPage ? ' header--transparent' : ''}`}>
      <div className="header-container">
        {/* Logo a la izquierda */}
        <div className="logo-container">
          <img
            src={logoTripSync}
            alt="TripSync Logo"
            className="logo-image"
            onClick={() => handleNavClick(null)}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Navegación en el centro */}
        <nav className="nav-center">
          <ul className="nav-links">
            <li>
              <button className="nav-link" onClick={() => handleNavClick(null)}>Inicio</button>
            </li>
            <li>
              <button className="nav-link" onClick={() => handleNavClick('sobre-web')}>Sobre la web</button>
            </li>
            <li>
              <button className="nav-link" onClick={() => handleNavClick('que-ofrece')}>Qué ofrece</button>
            </li>
          </ul>
        </nav>

        {/* Acciones de usuario a la derecha */}
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
