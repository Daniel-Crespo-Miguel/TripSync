import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, arrayRemove } from "firebase/firestore";
import "../styles/dashboard.css";

interface Grupo {
  id: string;
  name: string;
  destination: string;
  startDate: { seconds: number; nanoseconds: number };
  endDate: { seconds: number; nanoseconds: number };
  createdBy: string;
  heroImageUrl?: string;
}

function Dashboard() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }
      setUser(currentUser);

      const gruposRef = collection(db, "grupos");

      const qInvited = query(gruposRef, where("invitados", "array-contains", currentUser.email));
      const snapshotInvited = await getDocs(qInvited);

      const items: Grupo[] = snapshotInvited.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        destination: d.data().destination,
        startDate: d.data().startDate,
        endDate: d.data().endDate,
        createdBy: d.data().createdBy,
        heroImageUrl: d.data().heroImageUrl ?? undefined,
      }));

      // Ordenar por fecha de inicio (más cercano primero)
      const sorted = items.sort((a, b) => {
        const dateA = new Date(a.startDate.seconds * 1000);
        const dateB = new Date(b.startDate.seconds * 1000);
        return dateA.getTime() - dateB.getTime();
      });

      setGrupos(sorted);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleDeleteGroup = async (grupoId: string) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, "grupos", grupoId));
      setGrupos(prev => prev.filter(grupo => grupo.id !== grupoId));
    } catch (error) {
      console.error("Error al eliminar el grupo:", error);
    }
  };

  const handleLeaveGroup = async (grupoId: string) => {
    if (!user) return;
    
    try {
      const grupoRef = doc(db, "grupos", grupoId);
      await updateDoc(grupoRef, {
        invitados: arrayRemove(user.email)
      });
      setGrupos(prev => prev.filter(grupo => grupo.id !== grupoId));
    } catch (error) {
      console.error("Error al abandonar el grupo:", error);
    }
  };

  const getEstadoViaje = (grupo: Grupo) => {
    const hoy = new Date();
    const inicio = new Date(grupo.startDate.seconds * 1000);
    const fin = new Date(grupo.endDate.seconds * 1000);

    if (hoy < inicio) return { label: "Próximo", statusClass: "badge--proximo" };
    if (hoy >= inicio && hoy <= fin) return { label: "En curso", statusClass: "badge--encurso" };
    return { label: "Finalizado", statusClass: "badge--finalizado" };
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
              const heroStyle = grupo.heroImageUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${grupo.heroImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined;
              return (
                <div
                  key={grupo.id}
                  className={`trip-card${grupo.heroImageUrl ? " trip-card--hero" : ""}`}
                  style={heroStyle}
                >
                  <div className="trip-card-content">
                    {user && user.uid === grupo.createdBy && (
                      <button
                        className="btn-card-icon btn-card-delete"
                        title="Eliminar viaje"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer.')) {
                            handleDeleteGroup(grupo.id);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    )}

                    {user && user.uid !== grupo.createdBy && (
                      <button
                        className="btn-card-icon btn-card-leave"
                        title="Abandonar viaje"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('¿Estás seguro de que quieres abandonar este viaje?')) {
                            handleLeaveGroup(grupo.id);
                          }
                        }}
                      >
                        🚪
                      </button>
                    )}

                    <div className="trip-header">
                      <h3 className="trip-name">{grupo.name}</h3>
                      <span className={`trip-status-badge ${estado.statusClass}`}>
                        {estado.label}
                      </span>
                    </div>

                    <div className="trip-destination">
                      <span className="destination-icon">📍</span>
                      <span className="destination-text">{grupo.destination}</span>
                    </div>

                    <div className="trip-dates">
                      <span className="dates-label">📅 Fechas</span>
                      <span className="dates-value">
                        {formatDate(grupo.startDate)} – {formatDate(grupo.endDate)}
                      </span>
                    </div>

                    <button className="btn-view-details" onClick={() => navigate(`/grupo/${grupo.id}`)}>
                      Ver detalles →
                    </button>
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
