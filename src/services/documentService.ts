import { supabase } from "./supabaseClient";

export interface AIExtractedData {
  type: "vuelo" | "hotel" | "tren" | "entrada" | "restaurante" | "otro";
  title: string;
  date: string;
  time: string | null;
  provider: string;
  details: string;
}

export async function uploadPdfToSupabase(
  groupId: string,
  file: File
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("El archivo no puede superar 10MB");
  }
  const fileName = `${groupId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("documentos")
    .upload(fileName, file, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(`Storage error: ${error.message}`);

  const { data } = supabase.storage
    .from("documentos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function extractWithAI(
  base64Data: string,
  fileName: string
): Promise<AIExtractedData> {
  const webhookUrl = import.meta.env.VITE_N8N_PDF_URL;
  if (!webhookUrl) throw new Error("VITE_N8N_PDF_URL no configurada");

  const webhookSecret = import.meta.env.VITE_WEBHOOK_SECRET;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": webhookSecret,
    },
    body: JSON.stringify({
      pdfBase64: base64Data,
      fileName,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`n8n webhook error: ${err}`);
  }

  const data = await response.json();
  const validTypes = ["vuelo", "hotel", "tren", "entrada", "restaurante", "otro"] as const;
  const obj =
    data.extracted !== null && typeof data.extracted === "object"
      ? (data.extracted as Record<string, unknown>)
      : {};

  return {
    type:     validTypes.includes(obj.type as typeof validTypes[number]) ? (obj.type as AIExtractedData["type"]) : "otro",
    title:    typeof obj.title    === "string" && obj.title.trim()    ? obj.title.trim()    : "",
    date:     typeof obj.date     === "string" && obj.date.trim()     ? obj.date.trim()     : "",
    time:     typeof obj.time     === "string" && obj.time.trim()     ? obj.time.trim()     : null,
    provider: typeof obj.provider === "string" && obj.provider.trim() ? obj.provider.trim() : "",
    details:  typeof obj.details  === "string" && obj.details.trim()  ? obj.details.trim()  : "",
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:application/pdf;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
