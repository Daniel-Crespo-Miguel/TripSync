import { useState } from "react";
import { checkAIWhitelist, fetchSentimentFeedback } from "../services/aiService";
import { SentimentResult } from "../types/ai";

type UseAIFeedbackResult = {
  result: SentimentResult | null;
  loading: boolean;
  error: string | null;
  submitFeedback: (text: string, userEmail: string, userId: string) => Promise<void>;
  clear: () => void;
};

export function useAIFeedback(): UseAIFeedbackResult {
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFeedback(text: string, userEmail: string, userId: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const allowed = await checkAIWhitelist(userEmail);
      if (!allowed) {
        setError("Tu cuenta no tiene acceso al análisis de feedback con IA.");
        return;
      }

      const sentiment = await fetchSentimentFeedback(text, userId);
      setResult(sentiment);
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
