import { useState } from "react";

export default function Home() {
  const [pdf, setPdf] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const AUTH_KEY = process.env.NEXT_PUBLIC_AUTH_KEY;

  const uploadPdf = async () => {
    if (!pdf) return alert("Please select a PDF");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", pdf);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: AUTH_KEY },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDocumentId(data.documentId);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question) return alert("Enter a question");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_KEY,
        },
        body: JSON.stringify({ documentId, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Query failed");
      setAnswer(data.answer);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>PDF Q&A with OpenAI only</h1>
      <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
      <button onClick={uploadPdf} disabled={!pdf || loading}>
        Upload PDF
      </button>

      <div style={{ marginTop: 20 }}>
        <textarea
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          style={{ width: "100%" }}
        />
        <button onClick={askQuestion} disabled={!question || loading}>
          Ask
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {answer && (
        <div style={{ marginTop: 20, padding: 10, border: "1px solid lightgray" }}>
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
