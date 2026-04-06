import { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  uploadPdfToSupabase,
  extractWithAI,
  fileToBase64,
} from "../services/documentService";

export interface TripDocument {
  id: string;
  type: "vuelo" | "hotel" | "tren" | "entrada" | "restaurante" | "otro";
  title: string;
  date: string;
  time: string | null;
  provider: string;
  details: string;
  fileName: string;
  storageUrl: string;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export function useDocuments(groupId: string, userEmail: string) {
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const colRef = collection(db, "grupos", groupId, "documentos");
    const q = query(colRef, orderBy("date", "asc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: TripDocument[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TripDocument, "id">),
        }));
        setDocuments(docs);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [groupId]);

  const uploadDocument = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
if (!groupId) throw new Error("groupId is required");
      const base64 = await fileToBase64(file);
      const extracted = await extractWithAI(base64, file.name);
      const storageUrl = await uploadPdfToSupabase(groupId, file);

      const colRef = collection(db, "grupos", groupId, "documentos");
      await addDoc(colRef, {
        type: extracted.type,
        title: extracted.title || file.name,
        date: extracted.date,
        time: extracted.time ?? null,
        provider: extracted.provider,
        details: extracted.details,
        fileName: file.name,
        storageUrl,
        uploadedBy: userEmail,
        uploadedAt: Timestamp.now(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      await deleteDoc(doc(db, "grupos", groupId, "documentos", docId));
    } catch {
      setError("Error al eliminar el documento");
    }
  };

  return { documents, loading, uploading, error, uploadDocument, deleteDocument };
}
