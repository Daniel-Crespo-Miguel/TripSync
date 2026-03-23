import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const inviteToken = new URLSearchParams(location.search).get("inviteToken");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (inviteToken) {
        navigate(`/unirse/${inviteToken}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__overlay" />

      <div className="auth-card">
        <div className="auth-card__logo">✦</div>
        <h2 className="auth-card__title">Crear cuenta</h2>
        <p className="auth-card__subtitle">Empieza a planificar tus viajes</p>

        {error && <p className="auth-card__error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-card__form">
          <input
            type="email"
            className="auth-card__input"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-card__input"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="auth-card__btn" type="submit">
            Registrarse
          </button>
        </form>

        <p className="auth-card__footer">
          ¿Ya tienes cuenta?{' '}
          <a
            href={inviteToken ? `/login?inviteToken=${inviteToken}` : "/login"}
            className="auth-card__link"
          >
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
