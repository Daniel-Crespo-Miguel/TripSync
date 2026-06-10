/**
 * Demo seed script — creates a "Escocia — Junio 2026" trip in Firestore.
 *
 * Prerequisites:
 *   1. Create a Firebase Auth account for the demo user (Firebase Console → Auth → Add user).
 *   2. Add VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD to your .env file.
 *   3. Run: node --env-file=.env scripts/seedDemo.mjs
 *   4. Copy the printed VITE_DEMO_GROUP_ID into your .env file.
 *
 * The script is idempotent: if VITE_DEMO_GROUP_ID is already set and the group exists,
 * it exits without making changes.
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

// ── Config ──────────────────────────────────────────────────────────────────

const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
  VITE_DEMO_EMAIL,
  VITE_DEMO_PASSWORD,
  VITE_DEMO_GROUP_ID,
} = process.env;

if (!VITE_DEMO_EMAIL || !VITE_DEMO_PASSWORD) {
  console.error("❌  VITE_DEMO_EMAIL and VITE_DEMO_PASSWORD must be set in .env");
  process.exit(1);
}

const app = initializeApp({
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────────────────────────

const ts = (y, m, d) => Timestamp.fromDate(new Date(y, m - 1, d));
const isoDate = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const now = new Date().toISOString();

// ── Sign in ──────────────────────────────────────────────────────────────────

console.log("🔐  Signing in as demo user…");
const cred = await signInWithEmailAndPassword(auth, VITE_DEMO_EMAIL, VITE_DEMO_PASSWORD);
const demoUid = cred.user.uid;
console.log("✅  Signed in. UID:", demoUid);

// ── Idempotency check ────────────────────────────────────────────────────────

if (VITE_DEMO_GROUP_ID) {
  const snap = await getDoc(doc(db, "grupos", VITE_DEMO_GROUP_ID));
  if (snap.exists()) {
    console.log("ℹ️   Demo group already exists (VITE_DEMO_GROUP_ID is set and group found). Nothing to do.");
    console.log("    Group ID:", VITE_DEMO_GROUP_ID);
    process.exit(0);
  }
  console.log("⚠️   VITE_DEMO_GROUP_ID is set but group not found in Firestore — creating fresh.");
}

// ── Members ──────────────────────────────────────────────────────────────────

const members = [
  VITE_DEMO_EMAIL,
  "ana@example.com",
  "carlos@example.com",
  "sofia@example.com",
];

// ── Create grupo ─────────────────────────────────────────────────────────────

console.log("📝  Creating demo group…");

const grupoRef = await addDoc(collection(db, "grupos"), {
  name: "Escocia — Junio 2026",
  destination: "Edimburgo, Escocia",
  startDate: ts(2026, 6, 15),
  endDate: ts(2026, 6, 19),
  createdBy: demoUid,
  createdByEmail: VITE_DEMO_EMAIL,
  invitados: members,
  gastos: [
    {
      description: "Vuelos ida y vuelta (4 personas)",
      amount: 980,
      payer: "ana@example.com",
      paidBy: "ana@example.com",
      assignedTo: members,
      date: "2026-05-01",
    },
    {
      description: "Hotel The Scotsman (3 noches)",
      amount: 1200,
      payer: VITE_DEMO_EMAIL,
      paidBy: VITE_DEMO_EMAIL,
      assignedTo: members,
      date: "2026-06-15",
    },
    {
      description: "Alquiler coche Highlands",
      amount: 320,
      payer: "carlos@example.com",
      paidBy: "carlos@example.com",
      assignedTo: members,
      date: "2026-06-17",
    },
    {
      description: "Cena en The Witchery",
      amount: 280,
      payer: "sofia@example.com",
      paidBy: "sofia@example.com",
      assignedTo: members,
      date: "2026-06-16",
    },
    {
      description: "Entradas Castillo de Edimburgo",
      amount: 120,
      payer: VITE_DEMO_EMAIL,
      paidBy: VITE_DEMO_EMAIL,
      assignedTo: members,
      date: "2026-06-15",
    },
  ],
});

const groupId = grupoRef.id;
console.log("✅  Group created:", groupId);

// ── Tramo 1: Edimburgo ────────────────────────────────────────────────────────

console.log("📍  Creating Tramo 1 (Edimburgo)…");

const t1Ref = await addDoc(collection(db, "grupos", groupId, "tramos"), {
  destination: "Edimburgo, Escocia",
  startDate: ts(2026, 6, 15),
  endDate: ts(2026, 6, 17),
  order: 1,
  createdAt: serverTimestamp(),
});
const t1Id = t1Ref.id;

// Activities for Tramo 1
const t1Acts = collection(db, "grupos", groupId, "tramos", t1Id, "actividades");

await addDoc(t1Acts, {
  title: "Castillo de Edimburgo",
  description: "Visita al castillo histórico en la Royal Mile. Imprescindible para conocer la historia de Escocia. Las vistas sobre la ciudad son espectaculares.",
  date: new Date(2026, 5, 15).toISOString(),
  location: "Edimburgo, Escocia",
  createdBy: VITE_DEMO_EMAIL,
  createdAt: now,
  votes: [VITE_DEMO_EMAIL, "ana@example.com", "carlos@example.com"],
});

await addDoc(t1Acts, {
  title: "Paseo por Dean Village",
  description: "Pintoresco barrio victoriano junto al río Water of Leith. Uno de los rincones más fotogénicos de Edimburgo, alejado del turismo masivo.",
  date: null,
  location: "Edimburgo, Escocia",
  createdBy: "carlos@example.com",
  createdAt: now,
  votes: [VITE_DEMO_EMAIL, "ana@example.com", "carlos@example.com", "sofia@example.com"],
});

await addDoc(t1Acts, {
  title: "Cena en The Witchery",
  description: "Restaurante icónico junto al castillo, en un edificio del siglo XVI. Cocina escocesa de alta calidad con decoración gótica única.",
  date: new Date(2026, 5, 16).toISOString(),
  location: "Edimburgo, Escocia",
  createdBy: "sofia@example.com",
  createdAt: now,
  votes: [VITE_DEMO_EMAIL, "sofia@example.com"],
});

await addDoc(t1Acts, {
  title: "National Museum of Scotland",
  description: "Cinco plantas de historia natural, ciencia e historia escocesa. Entrada gratuita — plan perfecto para un día de lluvia.",
  date: null,
  location: "Edimburgo, Escocia",
  createdBy: "ana@example.com",
  createdAt: now,
  votes: [VITE_DEMO_EMAIL],
});

// Itinerary for Tramo 1
const t1Itin = collection(db, "grupos", groupId, "tramos", t1Id, "itinerario");

await addDoc(t1Itin, { date: isoDate(2026, 6, 15), time: "11:00", title: "Llegada a Edimburgo y check-in", notes: "Hotel The Scotsman, 1 Royal Mile", createdBy: VITE_DEMO_EMAIL, createdAt: now });
await addDoc(t1Itin, { date: isoDate(2026, 6, 15), time: "14:00", title: "Castillo de Edimburgo", notes: "Entradas ya reservadas online — llevar confirmación en el móvil", createdBy: VITE_DEMO_EMAIL, createdAt: now });
await addDoc(t1Itin, { date: isoDate(2026, 6, 15), time: "20:00", title: "Cena en The Witchery", notes: "Reserva a nombre de Sofía para 4 personas", createdBy: "sofia@example.com", createdAt: now });
await addDoc(t1Itin, { date: isoDate(2026, 6, 16), time: "09:30", title: "Desayuno escocés en The Larder", notes: null, createdBy: VITE_DEMO_EMAIL, createdAt: now });
await addDoc(t1Itin, { date: isoDate(2026, 6, 16), time: "11:00", title: "National Museum of Scotland", notes: "Entrada gratuita, abre a las 10:00", createdBy: "ana@example.com", createdAt: now });
await addDoc(t1Itin, { date: isoDate(2026, 6, 16), time: "16:30", title: "Arthur's Seat", notes: "Subida de ~1h, llevar ropa impermeable y calzado cómodo", createdBy: VITE_DEMO_EMAIL, createdAt: now });
await addDoc(t1Itin, { date: isoDate(2026, 6, 17), time: "08:30", title: "Recogida del coche de alquiler", notes: "Europcar Edinburgh Airport, reserva a nombre de Carlos", createdBy: "carlos@example.com", createdAt: now });

// ── Tramo 2: Highlands ───────────────────────────────────────────────────────

console.log("📍  Creating Tramo 2 (Highlands)…");

const t2Ref = await addDoc(collection(db, "grupos", groupId, "tramos"), {
  destination: "Highlands, Escocia",
  startDate: ts(2026, 6, 17),
  endDate: ts(2026, 6, 19),
  order: 2,
  createdAt: serverTimestamp(),
});
const t2Id = t2Ref.id;

// Activities for Tramo 2
const t2Acts = collection(db, "grupos", groupId, "tramos", t2Id, "actividades");

await addDoc(t2Acts, {
  title: "Loch Ness — Urquhart Castle",
  description: "El lago más famoso de Escocia y las ruinas medievales en su orilla. Ambiente misterioso con vistas impresionantes.",
  date: new Date(2026, 5, 17).toISOString(),
  location: "Highlands, Escocia",
  createdBy: VITE_DEMO_EMAIL,
  createdAt: now,
  votes: [VITE_DEMO_EMAIL, "ana@example.com", "carlos@example.com", "sofia@example.com"],
});

await addDoc(t2Acts, {
  title: "Glen Coe al amanecer",
  description: "El valle más dramático de Escocia. Las nubes bajas entre los picos al amanecer son de otro mundo.",
  date: new Date(2026, 5, 18).toISOString(),
  location: "Highlands, Escocia",
  createdBy: "ana@example.com",
  createdAt: now,
  votes: [VITE_DEMO_EMAIL, "ana@example.com"],
});

await addDoc(t2Acts, {
  title: "Castillo de Eilean Donan",
  description: "El castillo más fotografiado de Escocia, en la confluencia de tres lagos. La imagen icónica de las Highlands.",
  date: new Date(2026, 5, 18).toISOString(),
  location: "Highlands, Escocia",
  createdBy: "sofia@example.com",
  createdAt: now,
  votes: [VITE_DEMO_EMAIL, "carlos@example.com", "sofia@example.com"],
});

// Itinerary for Tramo 2
const t2Itin = collection(db, "grupos", groupId, "tramos", t2Id, "itinerario");

await addDoc(t2Itin, { date: isoDate(2026, 6, 17), time: "09:00", title: "Salida hacia las Highlands", notes: "Ruta por la A9, parada en Pitlochry para desayunar", createdBy: VITE_DEMO_EMAIL, createdAt: now });
await addDoc(t2Itin, { date: isoDate(2026, 6, 17), time: "13:00", title: "Loch Ness — Urquhart Castle", notes: "Entradas ~£12 por persona, reservar online", createdBy: VITE_DEMO_EMAIL, createdAt: now });
await addDoc(t2Itin, { date: isoDate(2026, 6, 17), time: "19:00", title: "Cena y alojamiento en Inverness", notes: "Hotel Inverness Palace, reservado", createdBy: "carlos@example.com", createdAt: now });
await addDoc(t2Itin, { date: isoDate(2026, 6, 18), time: "08:00", title: "Glen Coe al amanecer", notes: "Madrugar merece la pena — el valle es increíble con poca gente", createdBy: "ana@example.com", createdAt: now });
await addDoc(t2Itin, { date: isoDate(2026, 6, 18), time: "13:00", title: "Castillo de Eilean Donan", notes: "Junto al pueblo de Dornie, una de las paradas imprescindibles", createdBy: "sofia@example.com", createdAt: now });
await addDoc(t2Itin, { date: isoDate(2026, 6, 19), time: "10:00", title: "Regreso a Edimburgo y vuelo", notes: "Vuelo a las 18:30 — estar en el aeropuerto a las 16:30", createdBy: VITE_DEMO_EMAIL, createdAt: now });

// ── Chat messages ────────────────────────────────────────────────────────────

console.log("💬  Adding chat messages…");

const msgs = collection(db, "grupos", groupId, "messages");

await addDoc(msgs, { text: "¡¡Ya tenemos los vuelos!! Salimos el 15 de junio a las 7am desde Barajas 😍✈️", createdBy: "ana@example.com", createdByUid: "demo-uid-ana", createdAt: Timestamp.fromDate(new Date("2026-05-15T10:00:00")) });
await addDoc(msgs, { text: "He reservado el Hotel The Scotsman, está en plena Royal Mile. Localización perfecta!", createdBy: VITE_DEMO_EMAIL, createdByUid: demoUid, createdAt: Timestamp.fromDate(new Date("2026-05-15T10:05:00")) });
await addDoc(msgs, { text: "¿Alguien se apunta al alquiler del coche para las Highlands? Necesito saber cuántos somos para calcular el precio", createdBy: "carlos@example.com", createdByUid: "demo-uid-carlos", createdAt: Timestamp.fromDate(new Date("2026-05-20T16:30:00")) });
await addDoc(msgs, { text: "¡Yo me apunto! ¿Cuánto sale por persona?", createdBy: "sofia@example.com", createdByUid: "demo-uid-sofia", createdAt: Timestamp.fromDate(new Date("2026-05-20T16:45:00")) });
await addDoc(msgs, { text: "Unos 80€ cada uno si vamos los 4. Europcar tiene buenos SUV", createdBy: "carlos@example.com", createdByUid: "demo-uid-carlos", createdAt: Timestamp.fromDate(new Date("2026-05-20T17:00:00")) });
await addDoc(msgs, { text: "Perfecto, reserva para 4 entonces. Las Highlands requieren coche sí o sí", createdBy: "ana@example.com", createdByUid: "demo-uid-ana", createdAt: Timestamp.fromDate(new Date("2026-05-20T17:10:00")) });
await addDoc(msgs, { text: "¿Reservamos las entradas del castillo online? Sale más barato y evitamos colas de hasta 45 min", createdBy: VITE_DEMO_EMAIL, createdByUid: demoUid, createdAt: Timestamp.fromDate(new Date("2026-06-01T09:00:00")) });
await addDoc(msgs, { text: "Sí, reservadlas ya! La semana pasada tardaron bastante en la taquilla", createdBy: "carlos@example.com", createdByUid: "demo-uid-carlos", createdAt: Timestamp.fromDate(new Date("2026-06-01T09:15:00")) });

// ── Done ─────────────────────────────────────────────────────────────────────

console.log("\n✅  Demo seeded successfully!");
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Add these lines to your .env file:\n");
console.log(`VITE_DEMO_EMAIL=${VITE_DEMO_EMAIL}`);
console.log(`VITE_DEMO_PASSWORD=<your_demo_password>`);
console.log(`VITE_DEMO_GROUP_ID=${groupId}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

process.exit(0);
