import { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { fetchSentimentFeedback } from "../services/aiService";
import { SentimentResult } from "../types/ai";

type UseAIFeedbackResult = {
  result: SentimentResult | null;
  loading: boolean;
  error: string | null;
  submitFeedback: (text: string, userEmail: string, userId: string, groupId: string) => Promise<void>;
  clear: () => void;
};

export function useAIFeedback(): UseAIFeedbackResult {
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFeedback(text: string, userEmail: string, userId: string, groupId: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const sentiment = await fetchSentimentFeedback(text, userId);
      setResult(sentiment);

      await addDoc(collection(db, "feedback"), {
        groupId,
        userId,
        userEmail,
        text,
        sentiment: sentiment.sentiment,
        summary: sentiment.summary,
        createdAt: Timestamp.now(),
      });
    } catch (e) {
      setError("Error al analizar el feedback. Inténtalo de nuevo.");
      console.error("[useAIFeedback]", e);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setResult(null);
    setError(null);
  }

  return { result, loading, error, submitFeedback, clear };
}
