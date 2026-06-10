/**
 * Adds chat messages to the demo group.
 *
 * Note: Firestore security rules require createdBy == request.auth.token.email,
 * so all messages are written under the demo account's email.
 * The message text simulates a group conversation.
 *
 * Run: node --env-file=.env scripts/seedMessages.mjs
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const {
  VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
  VITE_DEMO_EMAIL, VITE_DEMO_PASSWORD, VITE_DEMO_GROUP_ID,
} = process.env;

if (!VITE_DEMO_EMAIL || !VITE_DEMO_PASSWORD || !VITE_DEMO_GROUP_ID) {
  console.error("❌  VITE_DEMO_EMAIL, VITE_DEMO_PASSWORD and VITE_DEMO_GROUP_ID must be set in .env");
  process.exit(1);
}

const app = initializeApp({
  apiKey: VITE_FIREBASE_API_KEY, authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID, storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID, appId: VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);

console.log("🔐  Signing in…");
const cred = await signInWithEmailAndPassword(auth, VITE_DEMO_EMAIL, VITE_DEMO_PASSWORD);
const uid = cred.user.uid;
console.log("✅  Signed in");

// All messages must use the demo account's email as createdBy (Firestore rule).
// The text simulates a realistic multi-person conversation.
const messages = [
  "✈️  Ana: ¡Ya tenemos los vuelos! Salimos el 15 de junio a las 7am desde Barajas 😍",
  "🏨  Yo: He reservado el Hotel The Scotsman en plena Royal Mile. Localización perfecta!",
  "🚗  Carlos: ¿Alguien se apunta al alquiler del coche para las Highlands? Necesito saber cuántos somos",
  "✋  Sofía: ¡Yo me apunto! ¿Cuánto sale por persona?",
  "🚗  Carlos: Unos 80€ cada uno si vamos los 4. Europcar tiene buenos SUV",
  "👍  Ana: Perfecto, reserva para 4. Las Highlands requieren coche sí o sí",
  "🏰  Yo: ¿Reservamos las entradas del Castillo online? Sale más barato y evitamos colas de 45 min",
  "✅  Carlos: Sí, reservadlas ya! La semana pasada tardaron mucho en taquilla",
];

console.log("💬  Adding messages…");
for (const text of messages) {
  const ref = await addDoc(collection(db, "grupos", VITE_DEMO_GROUP_ID, "messages"), {
    text,
    createdBy: VITE_DEMO_EMAIL,
    createdByUid: uid,
    createdAt: serverTimestamp(),
  });
  console.log("   ✓", text.substring(0, 55));
  // Small pause so serverTimestamp values are distinct and maintain order
  await new Promise((r) => setTimeout(r, 150));
}

console.log("\n✅  Messages seeded successfully!");
process.exit(0);
