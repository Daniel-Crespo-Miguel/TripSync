export type AISuggestion = {
  id: string;
  title: string;
  description: string;
  category: string;
  recommendedDay?: string;
};

export type SentimentResult = {
  sentiment: "positivo" | "neutral" | "negativo";
  summary: string;
};

export type AIWhitelistConfig = {
  emails: string[];
};

export type AISuggestionsPayload = {
  destination: string;
  dates: string;
  groupId: string;
  participantCount: number;
  existingActivities: string[];
  weatherSummary?: string;
  userPrompt?: string;
};

export type TransportSuggestion = {
  id: string;
  mode: string;        // e.g. "avion", "tren", "bus", "coche"
  title: string;
  description: string;
  estimatedDuration?: string;
  estimatedCost?: string;
  tips?: string[];
};

export type AITransportPayload = {
  destination: string;
  originCity: string;
  dates: string;
  groupId: string;
  participantCount: number;
  userPrompt?: string;
};
