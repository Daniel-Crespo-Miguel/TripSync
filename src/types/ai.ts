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
