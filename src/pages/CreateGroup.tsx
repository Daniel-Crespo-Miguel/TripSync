import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function CreateGroup() {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        await addDoc(collection(db, 'grupos'), {
          name,
          destination,
          startDate: Timestamp.fromDate(new Date(startDate)),
          endDate: Timestamp.fromDate(new Date(endDate)),
          createdBy: user.uid,
          createdByEmail: user.email,
          createdAt: Timestamp.now(),
        });

        navigate('/dashboard');
      } catch (error) {
        console.error('Error al crear el grupo:', error);
      }
    });
  };

  return (
    <div className="container mt-5">
      <h2>Crear nuevo grupo de viaje</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Nombre del grupo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Destino"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <div className="mb-3">
          <label className="form-label">Fecha de inicio</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha de fin</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-success" type="submit">Crear viaje</button>
      </form>
    </div>
  );
}

export default CreateGroup;
