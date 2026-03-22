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
  base64Data: string
): Promise<AIExtractedData> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("VITE_ANTHROPIC_API_KEY no configurada");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `Extract the following information from this travel reservation document and respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "type": "vuelo|hotel|tren|entrada|restaurante|otro",
  "title": "brief descriptive name of the reservation",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or null if not applicable",
  "provider": "company or venue name",
  "details": "one short sentence with key details"
}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const data = await response.json();
  const raw: string = data.content?.[0]?.text ?? "";

  const cleaned = raw
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleaned) as AIExtractedData;
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
