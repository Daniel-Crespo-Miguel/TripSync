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
    if (location.pathname === "/") {
      after();
      return;
    }
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
        <div className="footer-grid">

          {/* Col 1 — Brand */}
          <div className="footer-col footer-col--brand">
            <img
              src={whiteLogoTripSync}
              alt="TripSync Logo"
              className="footer-logo"
            />
            <h2 className="footer-brand-name">TripSync</h2>
            <p className="footer-brand-description">
              Organiza tus viajes en grupo sin complicaciones.
            </p>
          </div>

          {/* Col 2 — Navegación */}
          <div className="footer-col">
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

          {/* Col 3 — Contacto */}
          <div className="footer-col">
            <h3 className="footer-title">Contacto</h3>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <span className="footer-icon">📧</span>
                <span>crespiinx@gmail.com</span>
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

      {/* Copyright bar */}
      <div className="footer-bottom">
        <p>© 2026 TripSync · Hecho con ❤️ para viajeros</p>
      </div>
    </footer>
  );
};

export default Footer;
