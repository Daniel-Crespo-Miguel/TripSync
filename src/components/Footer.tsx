import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import logoTripSync from '../assets/Logo.png';

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

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-row">
          {/* Columna 1 - Marca */}
          <div className="footer-column">
            <div className="footer-logo">
              <img src={logoTripSync} alt="TripSync Logo" className="footer-logo-image" />
            </div>
            <p className="footer-description">
              TripSync es una plataforma para organizar viajes en grupo de forma sencilla, colaborativa y sin estrés.
            </p>
          </div>

          {/* Columna 2 - Funcionalidades */}
          <div className="footer-column">
            <h3 className="footer-title">Funcionalidades</h3>
            <ul className="footer-links">
              <li>
                <button 
                  className="footer-link"
                  onClick={() => handleFeatureClick('/dashboard')}
                >
                  Grupos de viaje
                </button>
              </li>
              <li>
                <button 
                  className="footer-link"
                  onClick={() => handleFeatureClick('/dashboard')}
                >
                  Gastos compartidos
                </button>
              </li>
              <li>
                <button 
                  className="footer-link"
                  onClick={() => handleFeatureClick('/dashboard')}
                >
                  Actividades
                </button>
              </li>
              <li>
                <button 
                  className="footer-link"
                  onClick={() => handleFeatureClick('/dashboard')}
                >
                  Itinerario
                </button>
              </li>
              <li>
                <button 
                  className="footer-link"
                  onClick={() => handleFeatureClick('/dashboard')}
                >
                  Clima
                </button>
              </li>
              <li>
                <button 
                  className="footer-link"
                  onClick={() => handleFeatureClick('/dashboard')}
                >
                  Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Contacto / Sociales */}
          <div className="footer-column">
            <h3 className="footer-title">Contacto</h3>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <span className="footer-icon">📧</span>
                <span>daniel.crespo@example.com</span>
              </div>
              <div className="footer-contact-item">
                <span className="footer-icon">📱</span>
                <span>+34 600 000 000</span>
              </div>
              <div className="footer-contact-item">
                <a 
                  href="https://linkedin.com/in/daniel-crespo-miguel" 
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