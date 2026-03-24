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

export type ItineraryActivity = {
  time: string;
  title: string;
  description: string;
  notes?: string;
};

export type ItineraryDay = {
  date: string;
  dayLabel: string;
  activities: ItineraryActivity[];
};

export type AIItineraryPayload = {
  destination: string;
  dates: string;
  groupId: string;
  participantCount: number;
  userPrompt: string;
  existingActivities: string[];
};

export type AITramoSuggestion = {
  destination: string;
  days: number;
  description: string;
  order: number;
  isNew: boolean;
};
