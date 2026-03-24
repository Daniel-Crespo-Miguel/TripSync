import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { useTramos, Tramo } from "../hooks/useTramos";

export interface Gasto {
  description: string;
  amount: number;
  paidBy: string;
  date?: string;
}

export interface Grupo {
  id: string;
  name: string;
  destination: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  createdByEmail: string;
  createdBy: string;
  invitados: string[];
  heroImageUrl?: string;
  inviteToken?: string;
  gastos?: Gasto[];
}

interface GroupContextType {
  grupo: Grupo | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  handleAddInvitado: (email: string) => Promise<void>;
  tramos: Tramo[];
  tramoActivo: Tramo | null;
  setTramoActivo: (tramo: Tramo) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};

interface GroupProviderProps {
  children: ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tramos, tramoActivo, setTramoActivo: setTramoActivoRaw } = useTramos(id);

  const setTramoActivo = (tramo: Tramo) => setTramoActivoRaw(tramo);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchGrupo = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, "grupos", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setGrupo({ id: docSnap.id, ...docSnap.data() } as Grupo);
        } else {
          navigate("/");
        }
      } catch (err) {
        setError("Error al cargar el grupo");
        console.error("Error fetching group:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrupo();
  }, [id, navigate]);

  const handleAddInvitado = async (email: string) => {
    if (!id || !email.trim()) return;

    try {
      const { updateDoc, arrayUnion } = await import("firebase/firestore");
      const grupoRef = doc(db, "grupos", id);
      await updateDoc(grupoRef, {
        invitados: arrayUnion(email.trim()),
      });

      setGrupo((prev) => ({
        ...prev!,
        invitados: prev?.invitados.includes(email.trim())
          ? prev.invitados
          : [...(prev?.invitados || []), email.trim()],
      }));
    } catch (err) {
      console.error("Error adding invitado:", err);
      throw err;
    }
  };

  const value: GroupContextType = {
    grupo,
    user,
    loading,
    error,
    handleAddInvitado,
    tramos,
    tramoActivo,
    setTramoActivo,
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};
