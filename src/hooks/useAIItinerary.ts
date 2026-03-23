import { useState } from "react";
import { fetchAIItinerary } from "../services/aiService";
import { AIItineraryPayload, ItineraryDay } from "../types/ai";

type UseAIItineraryResult = {
  days: ItineraryDay[];
  loading: boolean;
  error: string | null;
  generate: (payload: AIItineraryPayload) => Promise<void>;
  clear: () => void;
};

export function useAIItinerary(): UseAIItineraryResult {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(payload: AIItineraryPayload) {
    setLoading(true);
    setError(null);
    setDays([]);

    try {
      const result = await fetchAIItinerary(payload);
      setDays(result);
    } catch (e) {
      setError("Error al generar el itinerario. Inténtalo de nuevo.");
      console.error("[useAIItinerary]", e);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setDays([]);
    setError(null);
  }

  return { days, loading, error, generate, clear };
}
