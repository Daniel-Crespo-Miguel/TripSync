import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import whiteLogoTripSync from '../assets/White_Logo.png';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleFeatureClick = (path: string) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-row">
          {/* Columna 1 - Marca */}
          <div className="footer-column">
            <div className="footer-brand">
              <img src={whiteLogoTripSync} alt="TripSync Logo" className="footer-logo-image" />
            </div>
          </div>

          {/* Columna 2 - Acciones de usuario */}
          <div className="footer-column">
            <h3 className="footer-title">Acciones</h3>
            <div className="footer-actions">
              {user ? (
                <>
                  <button 
                    className="footer-link"
                    onClick={() => navigate('/dashboard')}
                  >
                    Ir al panel
                  </button>
                  <button 
                    className="footer-link"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="footer-link"
                    onClick={() => navigate('/login')}
                  >
                    Iniciar sesión
                  </button>
                  <button 
                    className="footer-link"
                    onClick={() => navigate('/register')}
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Columna 3 - Contacto / Sociales */}
          <div className="footer-column">
            <h3 className="footer-title">Contacto</h3>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <span className="footer-icon">📧</span>
                <span>crespiinx@gmail.com</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-icon">📱</span>
                <span>605454422</span>
              </div>
              <div className="footer-contact-item">
                <a 
                  href="https://www.linkedin.com/in/daniel-crespo-miguel90" 
                  className="footer-social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="footer-icon">💼</span>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
