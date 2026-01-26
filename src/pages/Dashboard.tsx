import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/dashboard.css";

interface Grupo {
  id: string;
  name: string;
  destination: string;
  startDate: { seconds: number; nanoseconds: number };
  endDate: { seconds: number; nanoseconds: number };
}

function Dashboard() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      const gruposRef = collection(db, "grupos");

      const qCreated = query(gruposRef, where("createdBy", "==", user.uid));
      const snapshotCreated = await getDocs(qCreated);

      const qInvited = query(gruposRef, where("invitados", "array-contains", user.email));
      const snapshotInvited = await getDocs(qInvited);

      const items: Grupo[] = [
        ...snapshotCreated.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          destination: d.data().destination,
          startDate: d.data().startDate,
          endDate: d.data().endDate,
        })),
        ...snapshotInvited.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          destination: d.data().destination,
          startDate: d.data().startDate,
          endDate: d.data().endDate,
        })),
      ];

      const unique = Array.from(new Map(items.map((g) => [g.id, g])).values());

      // Ordenar por fecha de inicio (más cercano primero)
      const sorted = unique.sort((a, b) => {
        const dateA = new Date(a.startDate.seconds * 1000);
        const dateB = new Date(b.startDate.seconds * 1000);
        return dateA.getTime() - dateB.getTime();
      });

      setGrupos(sorted);
    });

    return () => unsubscribe();
  }, [navigate]);

  const getEstadoViaje = (grupo: Grupo) => {
    const hoy = new Date();
    const inicio = new Date(grupo.startDate.seconds * 1000);
    const fin = new Date(grupo.endDate.seconds * 1000);

    if (hoy < inicio) return { label: "Próximo", color: "#10B981" };
    if (hoy >= inicio && hoy <= fin) return { label: "En curso", color: "#F59E0B" };
    return { label: "Finalizado", color: "#6B7280" };
  };

  const formatDate = (dateObj: { seconds: number; nanoseconds: number }) => {
    const date = new Date(dateObj.seconds * 1000);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title-section">
          <h1 className="dashboard-title">Mis viajes</h1>
          <p className="dashboard-subtitle">
            Gestiona y accede a todos tus viajes desde un solo lugar
          </p>
        </div>
        <button 
          className="btn-create-trip"
          onClick={() => navigate("/crear-viaje")}
        >
          + Crear viaje
        </button>
      </div>

      <div className="dashboard-content">
        {grupos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <h3>Aún no has creado ningún viaje</h3>
              <p>Empieza creando el primero y comienza a organizar tus próximas aventuras</p>
              <button 
                className="btn-create-trip-empty"
                onClick={() => navigate("/crear-viaje")}
              >
                Crear viaje
              </button>
            </div>
          </div>
        ) : (
          <div className="trips-grid">
            {grupos.map((grupo) => {
              const estado = getEstadoViaje(grupo);
              return (
                <div 
                  key={grupo.id}
                  className="trip-card"
                  onClick={() => navigate(`/grupo/${grupo.id}`)}
                >
                  <div className="trip-card-content">
                    <div className="trip-header">
                      <h3 className="trip-name">{grupo.name}</h3>
                      <span 
                        className="trip-status-badge"
                        style={{ backgroundColor: estado.color }}
                      >
                        {estado.label}
                      </span>
                    </div>
                    
                    <div className="trip-destination">
                      <span className="destination-text">{grupo.destination}</span>
                    </div>

                    <div className="trip-dates">
                      <span className="dates-label">Fechas:</span>
                      <span className="dates-value">
                        {formatDate(grupo.startDate)} - {formatDate(grupo.endDate)}
                      </span>
                    </div>

                    <div className="trip-actions">
                      <span className="action-text">Ver detalles</span>
                      <span className="action-arrow">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
