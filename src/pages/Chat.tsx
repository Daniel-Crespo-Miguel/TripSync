import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

type Message = {
  id: string;
  text: string;
  createdBy: string;
  createdByUid: string;
  createdAt?: any;
};

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const checkGroup = async () => {
      if (!id) return;

      const snap = await getDoc(doc(db, "grupos", id));
      if (!snap.exists()) {
        navigate("/");
        return;
      }

      const data = snap.data();
      const email = user.email;

      const isMember =
        data.createdBy === user.uid ||
        (Array.isArray(data.invitados) && data.invitados.includes(email));

      if (!isMember) {
        navigate("/");
      }
    };

    checkGroup();
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "grupos", id, "messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setMessages(list);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const user = auth.currentUser;
    if (!user || !text.trim()) return;

    await addDoc(collection(db, "grupos", id, "messages"), {
      text: text.trim(),
      createdBy: user.email,
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <div className="container mt-5 d-flex flex-column" style={{ height: "80vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="m-0">Chat del grupo</h2>
        <button className="btn btn-secondary" onClick={() => navigate(`/grupo/${id}`)}>
          Volver al grupo
        </button>
      </div>

      <div className="border rounded p-3 flex-grow-1 overflow-auto mb-3 bg-light">
        {loading ? (
          <p>Cargando mensajes...</p>
        ) : messages.length === 0 ? (
          <p>No hay mensajes aún.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="mb-2">
              <strong>{m.createdBy}</strong>: {m.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="d-flex gap-2">
        <input
          className="form-control"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button className="btn btn-primary" type="submit">
          Enviar
        </button>
      </form>
    </div>
  );
}

export default Chat;
