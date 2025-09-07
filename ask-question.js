import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Import the in-memory store from your upload API module
const { vectorStore } = require("./upload");

// Cosine similarity function remains the same
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
    const { documentId, question } = req.body;
    const embeddings = vectorStore[documentId];
    if (!embeddings) return res.status(404).json({ error: "Document not found" });

    // Create embedding for the question
    const qEmbeddingResponse = await openai.embeddings.create({
      input: question,
      model: "text-embedding-ada-002",
    });
    const qEmbedding = qEmbeddingResponse.data[0].embedding;

    // Find best matching chunk from stored embeddings
    let bestChunk = "";
    let bestScore = -Infinity;
    for (const e of embeddings) {
      const score = cosineSimilarity(e.embedding, qEmbedding);
      if (score > bestScore) {
        bestScore = score;
        bestChunk = e.text;
      }
    }

    // Create chat completion with the best context chunk
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant answering questions based on provided context." },
        { role: "user", content: `Context: ${bestChunk}\n\nQuestion: ${question}` },
      ],
    });

    return res.status(200).json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to answer question" });
  }
}
