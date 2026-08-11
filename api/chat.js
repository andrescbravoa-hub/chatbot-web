// Función serverless (Vercel) — oculta tu API key de Gemini.
// Ruta pública: POST /api/chat  { message: string, history?: [{role, text}] }

export default async function handler(req, res) {
  // CORS: permite que tu web llame a este endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Falta "message"' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el servidor' });
  }

  // Contexto: personaliza esto para tu negocio
  const SYSTEM_PROMPT =
    'Eres el asistente virtual de nuestra página web. Responde en español, ' +
    'de forma breve y útil. Si no sabes algo, dilo claramente.';

  const contents = [
    ...history.map((h) => ({
      role: h.role === 'bot' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        }),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      console.error('Gemini error:', data);
      return res.status(r.status).json({ error: data.error?.message || 'Error de Gemini' });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No pude generar una respuesta, intenta de nuevo.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
