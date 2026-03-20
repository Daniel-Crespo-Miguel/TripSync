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
