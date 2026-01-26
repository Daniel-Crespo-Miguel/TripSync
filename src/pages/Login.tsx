import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import bannerLogin from '../assets/Banner_Login.png';

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
    <div className="auth-layout">
      {/* Banner izquierdo (visual) */}
      <div className="auth-banner">
        <div className="auth-banner-content">
          <h1 className="auth-banner-title">
            Empieza a organizar tus viajes sin estrés
          </h1>
          <p className="auth-banner-subtitle">
            Planifica, colabora y disfruta cada momento del viaje
          </p>
        </div>
      </div>

      {/* Formulario derecho */}
      <div className="auth-form-container">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Iniciar Sesión</h2>
            <p className="auth-form-subtitle">Bienvenido de nuevo</p>
          </div>
          
          {error && <p className="auth-error">{error}</p>}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                className="form-control auth-input"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-control auth-input"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary auth-submit-btn" type="submit">
              Entrar
            </button>
          </form>
          
          <div className="auth-footer">
            <p className="auth-footer-text">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="auth-link">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
