import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { AISuggestion, AISuggestionsPayload, AIItineraryPayload, AITransportPayload, ItineraryDay, SentimentResult, TransportSuggestion } from "../types/ai";

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

// --- Feature 3: AI Transport Suggestions ---

function mockTransport(): TransportSuggestion[] {
  return [
    {
      id: "mock-transport-1",
      mode: "avion",
      title: "Vuelo directo — la opción más rápida",
      description: "Para este destino el vuelo suele ser la opción más eficiente en tiempo. Reserva con antelación para conseguir mejores precios.",
      estimatedDuration: "1–3 h",
      estimatedCost: "€€",
      tips: ["Compara en Google Flights y Skyscanner", "Evita equipaje facturado si puedes"],
    },
    {
      id: "mock-transport-2",
      mode: "tren",
      title: "Tren de alta velocidad — comodidad y puntualidad",
      description: "Opción muy cómoda para grupos, con buenas conexiones ferroviarias. Permite llevar más equipaje sin coste adicional.",
      estimatedDuration: "2–5 h",
      estimatedCost: "€€",
      tips: ["Reserva billetes de grupo en Renfe o Trainline", "Los billetes anticipados son bastante más baratos"],
    },
    {
      id: "mock-transport-3",
      mode: "coche",
      title: "Coche compartido — flexibilidad total",
      description: "Ideal si el grupo es reducido y quiere libertad de horarios. El coste se reparte entre los pasajeros.",
      estimatedDuration: "Variable",
      estimatedCost: "€–€€€",
      tips: ["Consulta peajes en Google Maps", "Compara con alquiler de vehículo si nadie tiene coche"],
    },
  ];
}

export async function fetchAITransport(
  payload: AITransportPayload
): Promise<TransportSuggestion[]> {
  const transportWebhookUrl = import.meta.env.VITE_N8N_TRANSPORT_URL as string | undefined;

  if (!transportWebhookUrl) {
    console.warn("[aiService] VITE_N8N_TRANSPORT_URL not set — using mock data");
    return mockTransport();
  }

  const response = await fetch(transportWebhookUrl, {
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
  return (data.suggestions ?? data) as TransportSuggestion[];
}

// --- Feature 4: AI Itinerary Generator ---

function mockItinerary(startSeconds?: number): ItineraryDay[] {
  const base = startSeconds ? new Date(startSeconds * 1000) : new Date();
  base.setHours(0, 0, 0, 0);
  const d1 = new Date(base);
  const d2 = new Date(base);
  d2.setDate(d2.getDate() + 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const label = (d: Date, n: number) =>
    `Día ${n} — ${d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}`;

  return [
    {
      date: fmt(d1),
      dayLabel: label(d1, 1),
      activities: [
        { time: "10:00", title: "Visita al Museo del Prado", description: "Contempla las obras maestras de Velázquez, Goya y El Greco en el museo más importante de España.", notes: "Reserva entradas online para evitar colas" },
        { time: "13:30", title: "Almuerzo en Mercado de San Miguel", description: "Tapas y productos gourmet en este icónico mercado cubierto junto a la Plaza Mayor." },
        { time: "16:00", title: "Paseo por el Retiro", description: "Relajaos en el parque, alquilad una barca y disfrutad del ambiente madrileño." },
      ],
    },
    {
      date: fmt(d2),
      dayLabel: label(d2, 2),
      activities: [
        { time: "09:30", title: "Desayuno en Malasaña", description: "Cafés de moda y exploración del barrio bohemio más auténtico de Madrid." },
        { time: "11:30", title: "Palacio Real y Catedral de la Almudena", description: "Visita los exteriores del Palacio Real y la impresionante catedral enfrente.", notes: "Entrada gratuita a la explanada" },
        { time: "15:00", title: "Ruta de tapas por La Latina", description: "Bares de toda la vida con las mejores cañas y pinchos del centro de Madrid." },
      ],
    },
  ];
}

export async function fetchAIItinerary(
  payload: AIItineraryPayload
): Promise<ItineraryDay[]> {
  const itineraryWebhookUrl = import.meta.env.VITE_N8N_ITINERARY_URL as string | undefined;

  if (!itineraryWebhookUrl) {
    console.warn("[aiService] VITE_N8N_ITINERARY_URL not set — using mock data");
    return mockItinerary();
  }

  const response = await fetch(itineraryWebhookUrl, {
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

  const text = await response.text();
  console.log("[fetchAIItinerary] raw response:", text);
  if (!text || text.trim() === "") return [];
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("[fetchAIItinerary] Invalid JSON:", text);
    return [];
  }
  const itinerary = data.itinerary ?? data.days ?? data;
  return Array.isArray(itinerary) ? itinerary : [];
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
