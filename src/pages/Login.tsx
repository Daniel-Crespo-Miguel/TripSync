import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
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
          <a href="/register" className="auth-card__link">
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
