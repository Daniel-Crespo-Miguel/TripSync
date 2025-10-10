import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';

function Expenses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState<any>(null);
  const [gasto, setGasto] = useState('');
  const [amount, setAmount] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const fetchGrupo = async () => {
      const docRef = doc(db, 'grupos', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setGrupo(docSnap.data());
      } else {
        navigate('/');
      }
    };

    fetchGrupo();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'grupos', id), (docSnap) => {
      if (docSnap.exists()) {
        setGrupo(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    const newExpense = {
      description: gasto,
      amount: parseFloat(amount),
      payer: 'usuario1@example.com', // Este debería ser el usuario autenticado
      assignedTo: assignedTo,
      date: new Date().toISOString(),
    };

    const groupRef = doc(db, 'grupos', id);
    await updateDoc(groupRef, {
      gastos: arrayUnion(newExpense),
    });

    setGasto('');
    setAmount('');
    setAssignedTo([]);
  };

  if (!grupo) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Gastos de {grupo.name}</h2>

      <form onSubmit={handleAddExpense}>
        <div className="form-group">
          <label>Descripción del gasto</label>
          <input
            type="text"
            className="form-control"
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Monto</label>
          <input
            type="number"
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Asignar a</label>
          <select
            className="form-control"
            multiple
            value={assignedTo}
            onChange={(e) =>
              setAssignedTo(Array.from(e.target.selectedOptions, (option) => option.value))
            }
          >
            {grupo.invitados.map((user: string) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary mt-3">
          Añadir Gasto
        </button>
      </form>

      <h3>Lista de Gastos</h3>
      <ul>
        {grupo.gastos.map((g: any, index: number) => (
          <li key={g.date}>
            {g.description} - {g.amount}€ (Payer: {g.payer})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Expenses;
