// /api/speak.js
// Vercel serverless function. Converts the assistant's reply to spoken
// audio using Groq's TTS API. Uses the same GROQ_API_KEY as /api/chat.js —
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
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text.slice(0, 2000), // keep replies to a sane length
        voice: voice || "troy",
        response_format: "wav"
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

    const arrayBuffer = await groqRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/wav");
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
