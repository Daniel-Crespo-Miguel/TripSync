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
        <div className="footer-content">
          {/* Bloque izquierdo - Marca */}
          <div className="footer-brand-block">
            <div className="footer-brand-content">
              <img src={whiteLogoTripSync} alt="TripSync Logo" className="footer-logo-large" />
              <h2 className="footer-brand-name">TripSync</h2>
              <p className="footer-brand-description">
                Organiza viajes en grupo sin complicaciones
              </p>
            </div>
          </div>

          {/* Bloque derecho - Card de contenido */}
          <div className="footer-content-card">
            <div className="footer-columns">
              {/* Columna izquierda - Navegación */}
              <div className="footer-column">
                <h3 className="footer-title">Navegación</h3>
                <div className="footer-navigation">
                  <button 
                    className="footer-link"
                    onClick={() => navigate('/')}
                  >
                    Inicio
                  </button>
                  <button 
                    className="footer-link"
                    onClick={() => navigate('/about')}
                  >
                    Sobre la web
                  </button>
                  <button 
                    className="footer-link"
                    onClick={() => navigate('/')}
                  >
                    Qué ofrece
                  </button>
                </div>
              </div>

              {/* Columna derecha - Contacto */}
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
