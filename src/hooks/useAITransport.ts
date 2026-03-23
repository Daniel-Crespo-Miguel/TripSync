import { useState } from "react";
import { fetchAITransport } from "../services/aiService";
import { AITransportPayload, TransportSuggestion } from "../types/ai";

type UseAITransportResult = {
  suggestions: TransportSuggestion[];
  loading: boolean;
  error: string | null;
  getSuggestions: (payload: AITransportPayload) => Promise<void>;
  clear: () => void;
};

export function useAITransport(): UseAITransportResult {
  const [suggestions, setSuggestions] = useState<TransportSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getSuggestions(payload: AITransportPayload) {
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const result = await fetchAITransport(payload);
      setSuggestions(result);
    } catch (e) {
      setError("Error al obtener sugerencias. Inténtalo de nuevo.");
      console.error("[useAITransport]", e);
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
