// /api/transcribe.js
// Vercel serverless function. Converts recorded patient speech to text
// using Groq's Whisper API. Uses the same GROQ_API_KEY as /api/chat.js —
// the key never reaches the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY is not set on the server" });
  }

  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "No audio provided" });
    }

    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: mimeType || "audio/webm" });

    const form = new FormData();
    form.append("file", blob, "recording.webm");
    form.append("model", "whisper-large-v3-turbo");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: form
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json(data);
    }

    return res.status(200).json({ text: data.text || "" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
