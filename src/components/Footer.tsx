import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import whiteLogoTripSync from "../assets/White_Logo.png";

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goHomeAndThen = (after: () => void) => {
    // Si ya estamos en home, ejecuta directamente
    if (location.pathname === "/") {
      after();
      return;
    }

    // Si no, navega a home y espera un tick para que monte el DOM
    navigate("/", { replace: false });
    setTimeout(after, 80);
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    goHomeAndThen(scrollToTop);
  };

  const handleSectionClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    goHomeAndThen(() => scrollToId(sectionId));
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Bloque izquierdo - Marca */}
          <div className="footer-brand-block">
            <div className="footer-brand-content">
              <img
                src={whiteLogoTripSync}
                alt="TripSync Logo"
                className="footer-logo-large"
              />
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
                  <button className="footer-link" onClick={handleHomeClick}>
                    Inicio
                  </button>

                  <button
                    className="footer-link"
                    onClick={(e) => handleSectionClick(e, "sobre-web")}
                  >
                    Sobre la web
                  </button>

                  <button
                    className="footer-link"
                    onClick={(e) => handleSectionClick(e, "banner-seccion")}
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
