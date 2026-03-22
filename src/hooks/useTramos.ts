import { useState, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  writeBatch,
  deleteField,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export type Tramo = {
  id: string;
  destination: string;
  startDate: { seconds: number };
  endDate: { seconds: number };
  heroImageUrl?: string;
  order: number;
  createdAt: unknown;
};

export function useTramos(groupId: string | undefined) {
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [tramoActivo, setTramoActivo] = useState<Tramo | null>(null);
  const [loading, setLoading] = useState(true);
  const migratingRef = useRef(false);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    migratingRef.current = false;

    const tramosRef = collection(db, "grupos", groupId, "tramos");
    const q = query(tramosRef, orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tramosData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Tramo[];

      // Auto-migration: if no tramos exist, create Tramo 1 from root group data
      if (tramosData.length === 0 && !migratingRef.current) {
        migratingRef.current = true;
        await migrateToTramos(groupId);
        // onSnapshot will fire again once migration writes the new tramo
        return;
      }

      setTramos(tramosData);
      setLoading(false);

      setTramoActivo((prev) => {
        if (!prev) return tramosData[0] ?? null;
        const stillExists = tramosData.find((t) => t.id === prev.id);
        return stillExists ?? tramosData[0] ?? null;
      });
    });

    return () => unsubscribe();
  }, [groupId]);

  return { tramos, tramoActivo, setTramoActivo, loading };
}

async function migrateToTramos(groupId: string) {
  const grupoRef = doc(db, "grupos", groupId);
  const grupoSnap = await getDoc(grupoRef);
  if (!grupoSnap.exists()) return;

  const data = grupoSnap.data();
  const activities: Array<Record<string, unknown>> = data.activities ?? [];
  const itinerary: Array<Record<string, unknown>> = data.itinerary ?? [];

  // Create the first tramo using the group's main destination and dates
  const tramosRef = collection(db, "grupos", groupId, "tramos");
  const tramoRef = await addDoc(tramosRef, {
    destination: data.destination ?? "",
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    heroImageUrl: data.heroImageUrl ?? null,
    order: 1,
    createdAt: serverTimestamp(),
  });

  const tramoId = tramoRef.id;
  const batch = writeBatch(db);

  // Migrate activities to subcollection
  for (const act of activities) {
    const actId = act.id as string;
    if (!actId) continue;
    const { id: _actId, ...actData } = act;
    const actRef = doc(db, "grupos", groupId, "tramos", tramoId, "actividades", actId);
    batch.set(actRef, actData);
  }

  // Migrate itinerary items to subcollection
  for (const item of itinerary) {
    const itemId = item.id as string;
    if (!itemId) continue;
    const { id: _itemId, ...itemData } = item;
    const itemRef = doc(db, "grupos", groupId, "tramos", tramoId, "itinerario", itemId);
    batch.set(itemRef, itemData);
  }

  // Remove root-level arrays now that data lives in subcollections
  batch.update(grupoRef, {
    activities: deleteField(),
    itinerary: deleteField(),
  });

  await batch.commit();
}
