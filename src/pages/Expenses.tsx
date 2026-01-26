import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import "../styles/expenses.css";

type Expense = {
  description: string;
  amount: number;
  payer: string;
  assignedTo: string[];
  date: string;
};

type Grupo = {
  name: string;
  invitados: string[];
  gastos: Expense[];
};

type BalanceRow = {
  user: string;
  paid: number;
  owed: number;
  net: number;
};

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function computeBalances(members: string[], expenses: Expense[]): BalanceRow[] {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};

  for (const m of members) {
    paid[m] = 0;
    owed[m] = 0;
  }

  for (const e of expenses) {
    const amount = Number(e.amount) || 0;
    const payer = e.payer?.trim() || "";
    const assignedRaw = e.assignedTo?.length ? e.assignedTo : members;
    const assigned = assignedRaw.filter(Boolean);

    if (payer && !(payer in paid)) paid[payer] = 0;
    if (payer && !(payer in owed)) owed[payer] = 0;
    for (const u of assigned) {
      if (!(u in paid)) paid[u] = 0;
      if (!(u in owed)) owed[u] = 0;
    }

    if (payer) paid[payer] = round2((paid[payer] ?? 0) + amount);

    const share = assigned.length ? amount / assigned.length : 0;
    for (const u of assigned) {
      owed[u] = round2((owed[u] ?? 0) + share);
    }
  }

  const users = Array.from(
    new Set([...Object.keys(paid), ...Object.keys(owed)]),
  );

  return users
    .map((user) => {
      const p = paid[user] ?? 0;
      const o = owed[user] ?? 0;
      return {
        user,
        paid: round2(p),
        owed: round2(o),
        net: round2(p - o),
      };
    })
    .sort((a, b) => b.net - a.net);
}

function suggestSettlements(rows: BalanceRow[]): Settlement[] {
  const creditors = rows
    .filter((r) => r.net > 0.01)
    .map((r) => ({ user: r.user, amt: r.net }))
    .sort((a, b) => b.amt - a.amt);

  const debtors = rows
    .filter((r) => r.net < -0.01)
    .map((r) => ({ user: r.user, amt: -r.net }))
    .sort((a, b) => b.amt - a.amt);

  const out: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const x = Math.min(d.amt, c.amt);

    out.push({ from: d.user, to: c.user, amount: round2(x) });

    d.amt = round2(d.amt - x);
    c.amt = round2(c.amt - x);

    if (d.amt <= 0.01) i++;
    if (c.amt <= 0.01) j++;
  }

  return out;
}

function formatMoney(n: number) {
  return `${n.toFixed(2)} €`;
}

function Expenses() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState<Grupo | null>(null);

  const [gasto, setGasto] = useState("");
  const [amount, setAmount] = useState("");

  const [payer, setPayer] = useState<string>("");

  const [assignedTo, setAssignedTo] = useState<string[]>([]);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }

    const fetchGrupo = async () => {
      const docRef = doc(db, "grupos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;

        setGrupo({
          name: data.name ?? "Grupo",
          invitados: Array.isArray(data.invitados) ? data.invitados : [],
          gastos: Array.isArray(data.gastos) ? data.gastos : [],
        });
      } else {
        navigate("/");
      }
    };

    fetchGrupo();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "grupos", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;

        setGrupo({
          name: data.name ?? "Grupo",
          invitados: Array.isArray(data.invitados) ? data.invitados : [],
          gastos: Array.isArray(data.gastos) ? data.gastos : [],
        });
      }
    });

    return () => unsubscribe();
  }, [id]);

  const members = grupo?.invitados ?? [];
  const expenses = grupo?.gastos ?? [];

  useEffect(() => {
    if (!members.length) return;

    const current = auth.currentUser?.email ?? "";
    if (current && members.includes(current)) {
      setPayer(current);
    } else if (!payer) {
      setPayer(members[0]);
    }
  }, [members]);

  const balanceRows = useMemo(
    () => computeBalances(members, expenses),
    [members, expenses],
  );
  const settlements = useMemo(
    () => suggestSettlements(balanceRows),
    [balanceRows],
  );

  // Cálculos para las tarjetas de resumen
  const totalGasto = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentUser = auth.currentUser?.email ?? "";
  const currentUserBalance = balanceRows.find(r => r.user === currentUser);
  const currentUserPaid = currentUserBalance?.paid || 0;
  const currentUserNet = currentUserBalance?.net || 0;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const loggedEmail = auth.currentUser?.email;
    if (!loggedEmail) {
      alert("Necesitas iniciar sesión para añadir gastos.");
      navigate("/login");
      return;
    }

    const parsedAmount = Number(amount);
    if (!gasto.trim()) {
      alert("Escribe una descripción.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alert("Introduce un monto válido (> 0).");
      return;
    }

    const payerEmail = payer?.trim();
    if (!payerEmail) {
      alert("Selecciona quién pagó.");
      return;
    }
    if (!members.includes(payerEmail)) {
      alert("El pagador debe ser un invitado del grupo.");
      return;
    }

    const assignedFinal = assignedTo.length ? assignedTo : members;

    if (!assignedFinal.length) {
      alert(
        "No hay invitados en el grupo. Añade al menos uno para repartir gastos.",
      );
      return;
    }

    const newExpense: Expense = {
      description: gasto.trim(),
      amount: round2(parsedAmount),
      payer: payerEmail,
      assignedTo: assignedFinal,
      date: new Date().toISOString(),
    };

    const groupRef = doc(db, "grupos", id);
    await updateDoc(groupRef, {
      gastos: arrayUnion(newExpense),
    });

    setGasto("");
    setAmount("");
    setAssignedTo([]);
  };

  if (!grupo) {
    return <div className="container mt-5">Cargando...</div>;
  }

  return (
    <div className="expenses-page">
      {/* Cabecera de la página */}
      <div className="expenses-header">
        <h1 className="expenses-title">Gastos compartidos</h1>
        <div className="expenses-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate(`/grupo/${id}`)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-color)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'var(--primary-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          >
            Volver al grupo
          </button>
        </div>
      </div>

      {/* Resumen superior - Cards de resumen */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-label">Gasto total</div>
          <div className="summary-value">{formatMoney(totalGasto)}</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">👤</div>
          <div className="summary-label">Has pagado</div>
          <div className="summary-value">{formatMoney(currentUserPaid)}</div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">⚖️</div>
          <div className="summary-label">Balance personal</div>
          <div className={`summary-value ${currentUserNet > 0.01 ? 'balance-positive' : currentUserNet < -0.01 ? 'balance-negative' : ''}`}>
            {formatMoney(currentUserNet)}
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-label">Participantes</div>
          <div className="summary-value">{members.length}</div>
        </div>
      </div>

      {/* Formulario de añadir gasto */}
      <form onSubmit={handleAddExpense} className="expenses-form-card">
        <div className="form-header">
          <h3 className="form-title">Añadir gasto</h3>
          <p className="form-subtitle">Registra un nuevo gasto del grupo</p>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Descripción del gasto</label>
            <input
              type="text"
              className="form-input"
              value={gasto}
              onChange={(e) => setGasto(e.target.value)}
              required
              placeholder="Ej: Cena en restaurante"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Monto</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pagó</label>
            <select
              className="form-select"
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              required
              disabled={members.length === 0}
            >
              {members.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">
              Asignar a{" "}
              <small className="text-muted">
                (si no seleccionas nadie, se reparte entre todos)
              </small>
            </label>
            <select
              className="form-select"
              multiple
              value={assignedTo}
              onChange={(e) =>
                setAssignedTo(
                  Array.from(e.target.selectedOptions, (option) => option.value),
                )
              }
            >
              {members.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-add-expense" type="submit">
            + Añadir gasto
          </button>
        </div>
      </form>

      {/* Contenedor principal de contenido */}
      <div className="expenses-main">
        {/* Lista de gastos */}
        <div className="expenses-list-section">
          <h2 className="expenses-list-title">Lista de gastos</h2>
          
          {expenses.length === 0 ? (
            <div className="expenses-empty">
              <div className="empty-icon">💰</div>
              <h5 className="empty-title">No hay gastos aún</h5>
              <p className="empty-subtitle">Empieza añadiendo un gasto 👇</p>
            </div>
          ) : (
            expenses
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((g) => (
                <div key={g.date} className="expense-card">
                  <div className="expense-header">
                    <div className="expense-description">{g.description}</div>
                    <div className="expense-amount">{formatMoney(Number(g.amount) || 0)}</div>
                  </div>
                  
                  <div className="expense-details">
                    <strong>Pagó:</strong> {g.payer}
                  </div>
                  
                  <div className="expense-meta">
                    <span>Repartido entre: {(g.assignedTo?.length ? g.assignedTo : members).join(", ")}</span>
                    <span>{new Date(g.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Sección de balance */}
        <div className="balance-section">
          <h2 className="balance-title">Balance (tipo Tricount)</h2>

          {members.length === 0 ? (
            <div className="balance-empty">
              <div className="empty-icon">👥</div>
              <h5 className="empty-title">No hay invitados en el grupo</h5>
              <p className="empty-subtitle">Añade invitados para empezar a gestionar gastos</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="balance-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Pagado</th>
                      <th>Le toca</th>
                      <th>Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceRows.map((r) => (
                      <tr key={r.user}>
                        <td>{r.user}</td>
                        <td className="balance-amount">{formatMoney(r.paid)}</td>
                        <td className="balance-amount">{formatMoney(r.owed)}</td>
                        <td className="balance-amount">
                          <span
                            className={
                              r.net > 0.01
                                ? "balance-positive"
                                : r.net < -0.01
                                  ? "balance-negative"
                                  : ""
                            }
                          >
                            {formatMoney(r.net)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sección de liquidación */}
              <div className="settlement-section">
                <h3 className="settlement-title">Para saldar</h3>
                
                {settlements.length === 0 ? (
                  <div className="settlement-empty">
                    <div className="empty-icon">✅</div>
                    <h5 className="empty-title">Todo cuadrado</h5>
                    <p className="empty-subtitle">No hay deudas pendientes</p>
                  </div>
                ) : (
                  settlements.map((s, idx) => (
                    <div key={idx} className="settlement-card">
                      <div className="settlement-text">
                        <span className="settlement-highlight">{s.from}</span> paga a{" "}
                        <span className="settlement-highlight">{s.to}</span> —{" "}
                        <span className="settlement-amount">{formatMoney(s.amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Expenses;
