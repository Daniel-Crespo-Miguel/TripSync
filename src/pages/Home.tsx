import { useNavigate } from 'react-router-dom';
import paisaje from '../assets/paisaje.jpg';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-start py-5">
      <h1 className="text-center mb-4">¡Bienvenido a mi página!</h1>

      <button
        className="btn btn-primary mb-4"
        onClick={() => navigate('/about')}
      >
        Ver más sobre TripSync
      </button>

      <div className="w-75">
        <img
          src={paisaje}
          alt="Paisaje de bienvenida"
          className="img-fluid rounded shadow"
          style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
}

export default Home;
