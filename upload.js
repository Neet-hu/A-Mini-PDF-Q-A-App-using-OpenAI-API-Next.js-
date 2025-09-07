import pdfParse from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory store for demo (not persistent)
const vectorStore = {};

function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (req.headers.authorization !== process.env.AUTH_KEY) return res.status(401).json({ error: "Unauthorized" });

  try {
    const buffer = await new Promise((resolve, reject) => {
      const buffers = [];
      req.on("data", (chunk) => buffers.push(chunk));
      req.on("end", () => resolve(Buffer.concat(buffers)));
      req.on("error", reject);
    });

    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    // Split text into chunks, simple fixed size splits (better to chunk by sentences or paragraphs)
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    const embeddings = [];
    for (const chunk of chunks) {
      const response = await openai.createEmbedding({
        input: chunk,
        model: "text-embedding-ada-002",
      });
      embeddings.push({ text: chunk, embedding: response.data.data[0].embedding });
    }

    // Create random doc id and save embedding chunks in vectorStore
    const documentId = Math.random().toString(36).slice(2);
    vectorStore[documentId] = embeddings;

    return res.status(200).json({ documentId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to process PDF" });
  }
}
