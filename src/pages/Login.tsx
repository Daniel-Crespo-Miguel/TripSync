import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_GROUP_ID, IS_DEMO_AVAILABLE } from '../utils/demo';
import '../styles/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inviteToken = new URLSearchParams(location.search).get("inviteToken");

  const handleDemoLogin = async () => {
    if (!IS_DEMO_AVAILABLE) {
      setError("La demo no está disponible. Configura VITE_DEMO_EMAIL, VITE_DEMO_PASSWORD y VITE_DEMO_GROUP_ID.");
      return;
    }
    setLoadingDemo(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, DEMO_EMAIL!, DEMO_PASSWORD!);
      navigate(`/grupo/${DEMO_GROUP_ID}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        <h2 className="auth-card__title">Iniciar Sesión</h2>
        <p className="auth-card__subtitle">Bienvenido de nuevo</p>

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
            Entrar
          </button>
        </form>

        <p className="auth-card__footer">
          ¿No tienes cuenta?{' '}
          <a
            href={inviteToken ? `/register?inviteToken=${inviteToken}` : "/register"}
            className="auth-card__link"
          >
            Regístrate aquí
          </a>
        </p>

        <div className="auth-card__divider">
          <span>o</span>
        </div>

        <button
          type="button"
          className="auth-card__btn auth-card__btn--demo"
          onClick={handleDemoLogin}
          disabled={loadingDemo}
        >
          {loadingDemo ? "Entrando en demo..." : "Explorar demo"}
        </button>
        <p className="auth-card__demo-hint">
          Accede a un viaje de ejemplo sin registrarte
        </p>
      </div>
    </div>
  );
}

export default Login;
