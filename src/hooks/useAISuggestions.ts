import { useState } from "react";
import { checkAIWhitelist, fetchAISuggestions } from "../services/aiService";
import { AISuggestion, AISuggestionsPayload } from "../types/ai";

type UseAISuggestionsResult = {
  suggestions: AISuggestion[];
  loading: boolean;
  error: string | null;
  getSuggestions: (payload: AISuggestionsPayload, userEmail: string) => Promise<void>;
  clear: () => void;
};

export function useAISuggestions(): UseAISuggestionsResult {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getSuggestions(payload: AISuggestionsPayload, userEmail: string) {
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const allowed = await checkAIWhitelist(userEmail);
      if (!allowed) {
        setError("Tu cuenta no tiene acceso a las sugerencias con IA.");
        return;
      }

      const result = await fetchAISuggestions(payload);
      setSuggestions(result);
    } catch (e) {
      setError("Error al obtener sugerencias. Inténtalo de nuevo.");
      console.error("[useAISuggestions]", e);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setSuggestions([]);
    setError(null);
  }

  return { suggestions, loading, error, getSuggestions, clear };
}
