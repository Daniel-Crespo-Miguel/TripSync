import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

type FeedbackEntry = {
  id: string;
  text: string;
  sentiment: "positivo" | "neutral" | "negativo";
  summary: string;
  userEmail: string;
  createdAt: { seconds: number } | null;
};

type Props = {
  groupId: string;
};

function getScoreLabel(positivos: number, neutrales: number, negativos: number): string {
  const total = positivos + neutrales + negativos;
  if (total === 0) return "";
  const score = (positivos + neutrales * 0.5) / total;
  if (score >= 0.75) return "Muy positivo";
  if (score >= 0.55) return "Positivo";
  if (score >= 0.45) return "Mixto";
  if (score >= 0.25) return "Negativo";
  return "Muy negativo";
}

export default function FeedbackDashboard({ groupId }: Props) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "feedback"),
      where("groupId", "==", groupId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as FeedbackEntry))
        .sort((a, b) => {
          const aMs = a.createdAt?.seconds ?? 0;
          const bMs = b.createdAt?.seconds ?? 0;
          return bMs - aMs;
        });
      setEntries(docs);
      setLoading(false);
    }, (err) => {
      console.error("[FeedbackDashboard]", err);
      setLoading(false);
    });

    return () => unsub();
  }, [groupId]);

  if (loading) return null;

  const positivos = entries.filter((e) => e.sentiment === "positivo").length;
  const neutrales = entries.filter((e) => e.sentiment === "neutral").length;
  const negativos = entries.filter((e) => e.sentiment === "negativo").length;
  const total = entries.length;

  if (total === 0) {
    return (
      <div className="fb-dashboard fb-dashboard--empty">
        <span className="fb-empty-icon">📊</span>
        <p className="fb-empty-text">
          Aún no hay valoraciones de este viaje. ¡Sé el primero en dejar tu opinión!
        </p>
      </div>
    );
  }

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const scoreLabel = getScoreLabel(positivos, neutrales, negativos);

  return (
    <div className="fb-dashboard">
      {/* Counters */}
      <div className="fb-counters">
        <div className="fb-counter fb-counter--positivo">
          <span className="fb-counter__icon">😊</span>
          <span className="fb-counter__num">{positivos}</span>
          <span className="fb-counter__label">positivos</span>
        </div>
        <div className="fb-counter fb-counter--neutral">
          <span className="fb-counter__icon">😐</span>
          <span className="fb-counter__num">{neutrales}</span>
          <span className="fb-counter__label">neutrales</span>
        </div>
        <div className="fb-counter fb-counter--negativo">
          <span className="fb-counter__icon">😟</span>
          <span className="fb-counter__num">{negativos}</span>
          <span className="fb-counter__label">negativos</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="fb-bar">
        {positivos > 0 && (
          <div className="fb-bar__seg fb-bar__seg--positivo" style={{ width: `${pct(positivos)}%` }} />
        )}
        {neutrales > 0 && (
          <div className="fb-bar__seg fb-bar__seg--neutral" style={{ width: `${pct(neutrales)}%` }} />
        )}
        {negativos > 0 && (
          <div className="fb-bar__seg fb-bar__seg--negativo" style={{ width: `${pct(negativos)}%` }} />
        )}
      </div>

      {/* Score */}
      <p className="fb-score">
        Valoración general: <strong>{scoreLabel}</strong>
      </p>

      {/* List */}
      <div className="fb-list">
        {entries.map((entry) => {
          const date = entry.createdAt
            ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString("es-ES")
            : "";
          const truncated =
            entry.text.length > 120 ? entry.text.substring(0, 120) + "…" : entry.text;
          return (
            <div key={entry.id} className="fb-item">
              <div className="fb-item__top">
                <span className={`fb-pill fb-pill--${entry.sentiment}`}>
                  {entry.sentiment === "positivo"
                    ? "😊"
                    : entry.sentiment === "neutral"
                    ? "😐"
                    : "😟"}{" "}
                  {entry.sentiment}
                </span>
                <span className="fb-item__date">{date}</span>
              </div>
              <p className="fb-item__text">{truncated}</p>
              {entry.summary && (
                <p className="fb-item__summary">"{entry.summary}"</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
