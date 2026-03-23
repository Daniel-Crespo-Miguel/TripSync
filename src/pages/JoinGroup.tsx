import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, limit, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import "../styles/joinGroup.css";

type JoinState = "loading" | "joining" | "error" | "already-member";

function JoinGroup() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<JoinState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("Enlace no válido.");
      setState("error");
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        navigate(`/login?inviteToken=${token}`);
        return;
      }

      // User is logged in — look up the group
      setState("joining");

      try {
        const q = query(
          collection(db, "grupos"),
          where("inviteToken", "==", token),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setErrorMsg("El enlace de invitación no es válido o ha expirado.");
          setState("error");
          return;
        }

        const groupDoc = snapshot.docs[0];
        const groupId = groupDoc.id;
        const data = groupDoc.data();
        const invitados: string[] = data.invitados ?? [];
        const userEmail = user.email ?? "";

        if (invitados.includes(userEmail)) {
          navigate(`/grupo/${groupId}`);
          return;
        }

        await updateDoc(doc(db, "grupos", groupId), {
          invitados: arrayUnion(userEmail),
        });

        navigate(`/grupo/${groupId}`);
      } catch (err) {
        console.error("Error joining group:", err);
        setErrorMsg("Ocurrió un error al unirte al grupo. Inténtalo de nuevo.");
        setState("error");
      }
    });

    return () => unsubscribe();
  }, [token, navigate]);

  return (
    <div className="join-group-page">
      <div className="join-group-card">
        <div className="join-group-logo">✦</div>

        {state === "loading" && (
          <>
            <h2 className="join-group-title">Verificando enlace...</h2>
            <div className="join-group-spinner" />
          </>
        )}

        {state === "joining" && (
          <>
            <h2 className="join-group-title">Uniéndote al viaje...</h2>
            <div className="join-group-spinner" />
          </>
        )}

        {state === "already-member" && (
          <>
            <h2 className="join-group-title">Ya eres miembro</h2>
            <p className="join-group-subtitle">Redirigiendo al grupo...</p>
          </>
        )}

        {state === "error" && (
          <>
            <h2 className="join-group-title">Enlace no válido</h2>
            <p className="join-group-error">{errorMsg}</p>
            <button className="join-group-btn" onClick={() => navigate("/dashboard")}>
              Ir al dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default JoinGroup;
