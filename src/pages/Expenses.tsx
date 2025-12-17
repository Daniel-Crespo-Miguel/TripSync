import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";

type Expense = {
  description: string;
  amount: number;
  payer: string; // email
  assignedTo: string[]; // emails
  date: string; // ISO
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
  net: number; // paid - owed
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

  // init con miembros del grupo
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

  const users = Array.from(new Set([...Object.keys(paid), ...Object.keys(owed)]));

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

  // Tiempo real
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

  const balanceRows = useMemo(() => computeBalances(members, expenses), [members, expenses]);
  const settlements = useMemo(() => suggestSettlements(balanceRows), [balanceRows]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const payerEmail = auth.currentUser?.email;
    if (!payerEmail) {
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

    const assignedFinal = assignedTo.length ? assignedTo : members;

    if (!assignedFinal.length) {
      alert("No hay invitados en el grupo. Añade al menos uno para repartir gastos.");
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
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Gastos de {grupo.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      <form onSubmit={handleAddExpense} className="card p-3 mb-4">
        <div className="mb-3">
          <label className="form-label">Descripción del gasto</label>
          <input
            type="text"
            className="form-control"
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Monto</label>
          <input
            type="number"
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Asignar a{" "}
            <small className="text-muted">
              (si no seleccionas nadie, se reparte entre todos)
            </small>
          </label>
          <select
            className="form-control"
            multiple
            value={assignedTo}
            onChange={(e) =>
              setAssignedTo(Array.from(e.target.selectedOptions, (option) => option.value))
            }
          >
            {members.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          Añadir Gasto
        </button>
      </form>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <h3>Lista de gastos</h3>
          {expenses.length === 0 ? (
            <p>No hay gastos aún.</p>
          ) : (
            <ul className="list-group">
              {expenses
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((g) => (
                  <li key={g.date} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <strong>{g.description}</strong>
                      <span>{formatMoney(Number(g.amount) || 0)}</span>
                    </div>
                    <div className="small text-muted">
                      Pagó: {g.payer} · Repartido entre:{" "}
                      {(g.assignedTo?.length ? g.assignedTo : members).join(", ")}
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="col-12 col-lg-6">
          <h3>Balance (tipo Tricount)</h3>

          {members.length === 0 ? (
            <p>No hay invitados en el grupo.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
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
                      <td>{formatMoney(r.paid)}</td>
                      <td>{formatMoney(r.owed)}</td>
                      <td>
                        <span
                          className={
                            r.net > 0.01
                              ? "text-success fw-bold"
                              : r.net < -0.01
                              ? "text-danger fw-bold"
                              : "fw-bold"
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
          )}

          <h4 className="mt-4">Para saldar</h4>
          {settlements.length === 0 ? (
            <p>Todo cuadrado ✅</p>
          ) : (
            <ul className="list-group">
              {settlements.map((s, idx) => (
                <li key={idx} className="list-group-item">
                  <strong>{s.from}</strong> paga a <strong>{s.to}</strong> —{" "}
                  <strong>{formatMoney(s.amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Expenses;
