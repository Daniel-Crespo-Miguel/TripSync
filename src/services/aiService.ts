import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { AISuggestion, AISuggestionsPayload, SentimentResult } from "../types/ai";

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
const WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET as string | undefined;

// --- Whitelist check ---

export async function checkAIWhitelist(email: string): Promise<boolean> {
  try {
    const ref = doc(db, "config", "aiWhitelist");
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const emails: string[] = snap.data().emails ?? [];
    return emails.includes(email);
  } catch {
    return false;
  }
}

// --- Mock fallbacks ---

function mockSuggestions(): AISuggestion[] {
  return [
    {
      id: "mock-1",
      title: "Visita al centro histórico",
      description: "Explora las calles y monumentos del casco antiguo a pie. Una experiencia imprescindible para conocer la historia local.",
      category: "Cultural",
      recommendedDay: "Día 1",
    },
    {
      id: "mock-2",
      title: "Ruta gastronómica",
      description: "Prueba los platos típicos de la zona visitando mercados y restaurantes locales. Ideal para los amantes de la cocina.",
      category: "Gastronomía",
      recommendedDay: "Día 2",
    },
    {
      id: "mock-3",
      title: "Excursión a la naturaleza",
      description: "Senderismo por los alrededores con vistas panorámicas. Perfecta para desconectar y disfrutar del paisaje.",
      category: "Naturaleza",
      recommendedDay: "Día 3",
    },
  ];
}

function mockSentiment(): SentimentResult {
  return {
    sentiment: "positivo",
    summary: "El feedback refleja una experiencia muy satisfactoria con el grupo.",
  };
}

// --- Feature 1: AI Activity Suggestions ---

export async function fetchAISuggestions(
  payload: AISuggestionsPayload
): Promise<AISuggestion[]> {
  if (!WEBHOOK_URL) {
    console.warn("[aiService] VITE_N8N_WEBHOOK_URL not set — using mock data");
    return mockSuggestions();
  }

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WEBHOOK_SECRET ? { "x-webhook-secret": WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as AISuggestion[];
}

// --- Feature 2: Sentiment Feedback ---

export async function fetchSentimentFeedback(
  text: string,
  userId: string
): Promise<SentimentResult> {
  const feedbackWebhookUrl = import.meta.env.VITE_N8N_FEEDBACK_URL as string | undefined;

  if (!feedbackWebhookUrl) {
    console.warn("[aiService] VITE_N8N_FEEDBACK_URL not set — using mock data");
    return mockSentiment();
  }

  const response = await fetch(feedbackWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WEBHOOK_SECRET ? { "x-webhook-secret": WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({ text, userId }),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as SentimentResult;
}
