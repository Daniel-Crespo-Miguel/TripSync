import { AISuggestion, AISuggestionsPayload, AIItineraryPayload, AITramoSuggestion, AITransportPayload, ItineraryDay, SentimentResult, TransportSuggestion } from "../types/ai";
import { isDemoMode } from "../utils/demo";

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
const WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET as string | undefined;

// --- Demo mode: Scotland-specific mocks ---

function mockDemoSuggestions(): AISuggestion[] {
  return [
    {
      id: "demo-act-1",
      title: "Ruta gastronómica por Edimburgo",
      description: "Recorre los mejores locales del Grassmarket y el Old Town: haggis tradicional, fish & chips y los mejores pubs escoceses.",
      category: "Gastronomía",
    },
    {
      id: "demo-act-2",
      title: "Castillo de Edimburgo",
      description: "Fortaleza medieval que domina la ciudad desde Castle Rock. Alberga las Joyas de la Corona escocesas y el Castillo más fotografiado del país.",
      category: "Cultural",
    },
    {
      id: "demo-act-3",
      title: "Paseo por Dean Village",
      description: "Pintoresco rincón victoriano junto al río Water of Leith, alejado del turismo masivo. Perfecto para fotos y disfrutar a pie.",
      category: "Naturaleza",
    },
    {
      id: "demo-act-4",
      title: "Excursión a las Highlands",
      description: "Día completo en coche por Glen Coe, Loch Ness y Eilean Donan Castle. El paisaje más espectacular de toda Escocia.",
      category: "Naturaleza",
    },
    {
      id: "demo-act-5",
      title: "Experiencia de whisky escocés",
      description: "Visita a una destilería y cata guiada de single malts. Las destilerías de Édimburgo como The Scotch Whisky Experience son ideales para principiantes.",
      category: "Gastronomía",
    },
    {
      id: "demo-act-6",
      title: "National Museum of Scotland",
      description: "Cinco plantas de historia escocesa, ciencia y naturaleza. Entrada gratuita — perfecto para días de lluvia (habituales en Escocia).",
      category: "Cultural",
    },
  ];
}

function mockDemoTransport(): TransportSuggestion[] {
  return [
    {
      id: "demo-transport-1",
      mode: "avion",
      title: "Vuelo directo a Edimburgo — la mejor opción",
      description: "Vuelos directos desde Madrid y Barcelona con Iberia, Ryanair y easyJet. Edinburgh Airport está bien conectado con el centro en tram (30 min).",
      estimatedDuration: "2h 30 min",
      estimatedCost: "€€",
      tips: ["Busca en Google Flights y Skyscanner", "El tram del aeropuerto al centro cuesta ~£8", "Reserva con 2-3 meses de antelación para mejores precios"],
    },
    {
      id: "demo-transport-2",
      mode: "tren",
      title: "ScotRail para moverse por Escocia",
      description: "Una vez en Edimburgo, el tren es la mejor opción para Inverness y las Highlands. Trayecto Edimburgo–Inverness: ~3h 30 min con vistas espectaculares.",
      estimatedDuration: "3–4 h",
      estimatedCost: "€€",
      tips: ["Compra en ScotRail.co.uk", "El Caledonian Sleeper conecta Edimburgo con Inverness de noche", "Reserva con antelación para tarifas reducidas"],
    },
    {
      id: "demo-transport-3",
      mode: "coche",
      title: "Coche de alquiler — imprescindible para las Highlands",
      description: "Para Glen Coe, Loch Ness y Eilean Donan no hay alternativa al coche. Las carreteras de una sola vía son parte de la experiencia.",
      estimatedDuration: "Variable",
      estimatedCost: "€€",
      tips: ["Alquila en el aeropuerto de Edimburgo", "Conducción por la izquierda — practica antes de ir a carreteras rurales", "Llena el depósito en ciudades; en las Highlands las gasolineras escasean"],
    },
  ];
}

function mockDemoItinerary(destination: string): ItineraryDay[] {
  const isHighlands = destination.toLowerCase().includes("highland");

  if (isHighlands) {
    return [
      {
        date: "2026-06-17",
        dayLabel: "Día 1 — miércoles, 17 de junio",
        activities: [
          { time: "09:00", title: "Salida hacia las Highlands", description: "Ruta por la A9 desde Edimburgo, parando en Pitlochry para desayunar.", notes: "Salir temprano para aprovechar la luz" },
          { time: "13:00", title: "Loch Ness — Urquhart Castle", description: "El lago más famoso de Escocia y las ruinas medievales del castillo en su orilla norte.", notes: "Entradas ~£12 por persona, reservar online" },
          { time: "19:00", title: "Alojamiento en Inverness", description: "Cena en el centro de Inverness y descanso.", notes: "Inverness Palace Hotel confirmado" },
        ],
      },
      {
        date: "2026-06-18",
        dayLabel: "Día 2 — jueves, 18 de junio",
        activities: [
          { time: "08:00", title: "Glen Coe al amanecer", description: "El valle más dramático de Escocia. Aparecer antes de las 9 para evitar grupos y ver las nubes bajas en los picos.", notes: "Llevar ropa impermeable y calzado de montaña" },
          { time: "13:00", title: "Castillo de Eilean Donan", description: "El castillo más fotografiado de Escocia, en la confluencia de tres lagos.", notes: "Cerca del pueblo de Dornie" },
          { time: "17:00", title: "Regreso hacia Edimburgo", description: "Ruta de vuelta por la costa oeste o por el centro.", notes: "3–4 h de conducción" },
        ],
      },
    ];
  }

  // Edinburgh (default)
  return [
    {
      date: "2026-06-15",
      dayLabel: "Día 1 — lunes, 15 de junio",
      activities: [
        { time: "11:00", title: "Llegada y paseo por el Old Town", description: "Check-in y primer paseo por la Royal Mile desde el castillo hasta Holyrood Palace.", notes: "Hotel The Scotsman en plena Royal Mile" },
        { time: "14:00", title: "Castillo de Edimburgo", description: "Visita guiada a la fortaleza más emblemática de Escocia con las Joyas de la Corona.", notes: "Entradas reservadas online — llevar confirmación" },
        { time: "20:00", title: "Cena en The Witchery", description: "Restaurante de cocina escocesa de autor en un edificio del siglo XVI junto al castillo.", notes: "Reserva a nombre de Sofía para 4 personas" },
      ],
    },
    {
      date: "2026-06-16",
      dayLabel: "Día 2 — martes, 16 de junio",
      activities: [
        { time: "09:30", title: "Desayuno escocés en The Larder", description: "Desayuno completo con haggis, huevos revueltos y tostadas de pan artesano.", notes: "Cafetería local muy valorada, sin reserva" },
        { time: "11:00", title: "National Museum of Scotland", description: "Cinco pisos de historia, arte y naturaleza escocesa. Entrada gratuita.", notes: "Abre a las 10:00, plan ideal para días nublados" },
        { time: "16:30", title: "Arthur's Seat al atardecer", description: "Subida al volcán extinto con vistas panorámicas de Edimburgo. La ciudad desde arriba es espectacular.", notes: "Subida de ~1h, llevar ropa impermeable" },
      ],
    },
  ];
}

function mockDemoTramos(): AITramoSuggestion[] {
  return [
    { destination: "Edimburgo, Escocia", days: 3, description: "Capital histórica con el castillo, la Royal Mile y los mejores pubs escoceses. Base ideal para explorar el sur.", order: 1, isNew: true },
    { destination: "Highlands, Escocia", days: 2, description: "Las tierras altas más salvajes de Europa: Glen Coe, Loch Ness y paisajes de película. Requiere coche.", order: 2, isNew: true },
    { destination: "St Andrews, Escocia", days: 1, description: "Ciudad universitaria medieval, cuna del golf y con una catedral en ruinas junto al mar del Norte.", order: 3, isNew: true },
  ];
}

function mockDemoChatReply(message: string, tramosCount: number): string {
  const lc = message.toLowerCase();
  if (lc.includes("highland") || lc.includes("glen") || lc.includes("loch")) {
    return "✨ Para las Highlands lo ideal es salir temprano. Glen Coe es especialmente impresionante antes de las 9 de la mañana, cuando las nubes bajas todavía cubren los picos. Loch Ness queda a unos 3h desde Edimburgo por la A9. Llevar siempre ropa impermeable — el tiempo cambia muy rápido.";
  }
  if (lc.includes("castillo") || lc.includes("edinburgh") || lc.includes("edimburgo") || lc.includes("royal mile")) {
    return "✨ El Castillo de Edimburgo es imprescindible. Os recomiendo reservar entradas online con antelación (sale más barato y evitáis colas de hasta 45 min). El tour de la Crown Room, donde están las Joyas de la Corona escocesas, es muy recomendable. Calculad 2–3 horas para recorrerlo bien.";
  }
  if (lc.includes("gasto") || lc.includes("dinero") || lc.includes("presupuesto") || lc.includes("coste") || lc.includes("pagar")) {
    return "✨ El presupuesto del viaje está bien repartido entre los 4. Los museos nacionales de Escocia (National Museum, National Gallery, etc.) son gratuitos — aprovechadlo para los días de lluvia. Recordad que en Reino Unido los precios son en libras esterlinas (GBP), y la propina en restaurantes suele ser del 10–12.5%.";
  }
  if (lc.includes("tiempo") || lc.includes("lluvia") || lc.includes("clima") || lc.includes("paraguas")) {
    return "✨ Junio en Escocia tiene unas 17–18°C de media, pero puede llover cualquier día. La regla de oro: llevar siempre un chubasquero ligero en la mochila. La buena noticia es que los paisajes con nubes bajas en las Highlands son absolutamente espectaculares.";
  }
  if (lc.includes("whisky") || lc.includes("whiskey") || lc.includes("cata")) {
    return "✨ Para el whisky, The Scotch Whisky Experience en la Royal Mile es perfecto para principiantes: cata guiada con historia y degustación incluida. Si queréis algo más auténtico, la destilería Holyrood está en el centro de Edimburgo y es muy recomendable.";
  }
  return `✨ Tenéis un viaje fantástico a Escocia con ${tramosCount} tramo${tramosCount !== 1 ? "s" : ""} planificados. Si tenéis dudas sobre el itinerario, actividades, gastos o qué llevar, con gusto os ayudo. ¡Escocia es increíble!`;
}

// --- Generic mock fallbacks ---

function mockSuggestions(): AISuggestion[] {
  return [
    {
      id: "mock-1",
      title: "Visita al centro histórico",
      description: "Explora las calles y monumentos del casco antiguo a pie. Una experiencia imprescindible para conocer la historia local.",
      category: "Cultural",
    },
    {
      id: "mock-2",
      title: "Ruta gastronómica",
      description: "Prueba los platos típicos de la zona visitando mercados y restaurantes locales. Ideal para los amantes de la cocina.",
      category: "Gastronomía",
    },
    {
      id: "mock-3",
      title: "Excursión a la naturaleza",
      description: "Senderismo por los alrededores con vistas panorámicas. Perfecta para desconectar y disfrutar del paisaje.",
      category: "Naturaleza",
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
  if (isDemoMode()) return mockDemoSuggestions();
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
  if (isDemoMode()) return mockDemoTransport();
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
  if (isDemoMode()) return mockDemoItinerary(payload.destination);
  const itineraryWebhookUrl = import.meta.env.VITE_N8N_ITINERARY_URL as string | undefined;

  if (!itineraryWebhookUrl) {
    console.warn("[aiService] VITE_N8N_ITINERARY_URL not set — using mock data");
    return mockItinerary();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(itineraryWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WEBHOOK_SECRET ? { "x-webhook-secret": WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e?.name === "AbortError") {
      throw new Error("La IA tardó demasiado en responder. Inténtalo de nuevo.");
    }
    throw e;
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text || text.trim() === "") {
    throw new Error("El servidor no devolvió ningún itinerario. Revisa la configuración del webhook.");
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("[fetchAIItinerary] Invalid JSON:", text);
    throw new Error("La respuesta del servidor no es válida. Inténtalo de nuevo.");
  }

  const unwrapped = Array.isArray(data) && data[0]?.json ? data[0].json : data;
  const itinerary = unwrapped.itinerary ?? unwrapped.days ?? unwrapped;
  if (!Array.isArray(itinerary)) {
    console.error("[fetchAIItinerary] Unexpected response shape:", data);
    throw new Error("Formato de respuesta inesperado. Inténtalo de nuevo.");
  }
  return itinerary;
}

// --- Feature 2: Sentiment Feedback ---

export async function fetchSentimentFeedback(
  text: string,
  userId: string
): Promise<SentimentResult> {
  if (isDemoMode()) return mockSentiment();
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

// --- Feature 5: AI Tramo Suggestions ---

function mockTramoSuggestions(): AITramoSuggestion[] {
  console.warn("[aiService] VITE_N8N_TRAMOS_URL not set — using mock tramo data");
  return [
    { destination: "Barcelona, Cataluña, España", days: 3, description: "Ciudad cosmopolita con arquitectura modernista, playa y gastronomía mediterránea.", order: 1, isNew: true },
    { destination: "Valencia, Comunidad Valenciana, España", days: 2, description: "Cuna de la paella, con un centro histórico vibrante y playas tranquilas.", order: 2, isNew: true },
    { destination: "Sevilla, Andalucía, España", days: 3, description: "Flamenco, tapas y el barrio de Santa Cruz en la capital andaluza.", order: 3, isNew: true },
  ];
}

export async function getAITramoSuggestions(params: {
  destination: string;
  totalDays: number;
  startDate: string;
  userPrompt: string;
  existingTramos: { destination: string; days: number; order: number }[];
}): Promise<AITramoSuggestion[]> {
  if (isDemoMode()) return mockDemoTramos();
  const tramosWebhookUrl = import.meta.env.VITE_N8N_TRAMOS_URL as string | undefined;

  if (!tramosWebhookUrl) {
    return mockTramoSuggestions();
  }

  const response = await fetch(tramosWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WEBHOOK_SECRET ? { "x-webhook-secret": WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const tramos = data.tramos ?? data;
  return Array.isArray(tramos) ? tramos : [];
}

// --- Feature 6: AI Chat Reply ---

export async function getAIChatReply(params: {
  message: string;
  groupName: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: string[];
  tramos: { destination: string; startDate: string; endDate: string; order: number }[];
  activities: string[];
  expenses: { description: string; amount: number; paidBy: string; date?: string }[];
}): Promise<string> {
  if (isDemoMode()) return mockDemoChatReply(params.message, params.tramos.length);
  const chatWebhookUrl = import.meta.env.VITE_N8N_CHAT_URL as string | undefined;

  if (!chatWebhookUrl) {
    console.warn("[aiService] VITE_N8N_CHAT_URL not set — using mock data");
    return `✨ Soy TripSync IA. [mock] Tu viaje tiene ${params.tramos.length} tramos planificados.`;
  }

  const response = await fetch(chatWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WEBHOOK_SECRET ? { "x-webhook-secret": WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.reply as string;
}
