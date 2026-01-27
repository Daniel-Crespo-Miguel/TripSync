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
    <div className="chat-container">
      <div className="chat-header">
        <h2 className="chat-title">Chat del grupo</h2>
        <button className="btn-back" onClick={() => navigate(`/grupo/${id}`)}>
          ← Volver al grupo
        </button>
      </div>

      <div className="chat-messages">
        {loading ? (
          <div className="loading-message">Cargando mensajes...</div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">No hay mensajes aún.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="message-bubble">
              <div className="message-header">
                <span className="message-author">{m.createdBy}</span>
                <span className="message-time">
                  {m.createdAt?.toDate().toLocaleTimeString()}
                </span>
              </div>
              <div className="message-text">{m.text}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <div className="input-container">
          <input
            className="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={500}
          />
          <button className="send-button" type="submit" disabled={!text.trim()}>
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
