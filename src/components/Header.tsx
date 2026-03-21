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

  const handleNavClick = (hash: string) => {
    if (location.pathname === '/') {
      // Si estamos en home, hacer scroll suave al hash
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Si no estamos en home, navegar a home con el hash
      navigate(`/${hash}`);
    }
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header className={`header ${isAuthPage ? 'header--transparent' : location.pathname === '/' ? 'header--sticky' : 'header--static'}`}>
      <div className="header-container">
        {/* Logo a la izquierda */}
        <div className="logo-container">
          <img 
            src={logoTripSync} 
            alt="TripSync Logo" 
            className="logo-image"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* Navegación en el centro */}
        <nav className="nav-center">
          <ul className="nav-links">
            <li>
              <a 
                href="/" 
                className="nav-link active"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
              >
                Inicio
              </a>
            </li>
            <li>
              <a 
                href="#sobre-web" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#sobre-web');
                }}
              >
                Sobre la web
              </a>
            </li>
            <li>
              <a 
                href="#banner-seccion" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#banner-seccion');
                }}
              >
                Qué ofrece
              </a>
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
