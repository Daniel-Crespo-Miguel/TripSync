import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
      <div className="footer-top-accent" />
      <div className="footer-container">

        <div className="footer-main-row">
          <span className="footer-brand">TripSync</span>
          <nav className="footer-nav">
            <button onClick={handleHomeClick}>Inicio</button>
            {" · "}
            <button onClick={(e) => handleSectionClick(e, "sobre-web")}>Sobre la web</button>
            {" · "}
            <button onClick={(e) => handleSectionClick(e, "banner-seccion")}>Qué ofrece</button>
          </nav>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom-row">
          © 2026 TripSync · crespiinx@gmail.com ·{" "}
          <a
            href="https://www.linkedin.com/in/daniel-crespo-miguel90"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-bottom-link"
          >
            LinkedIn
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
