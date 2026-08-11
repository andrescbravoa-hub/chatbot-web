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

  // Contexto: personalizado para Hospital Bravo
  const SYSTEM_PROMPT =
    'Eres el asistente virtual de Hospital Bravo, un hospital básico ubicado en ' +
    'Av. Jaime Roldós Aguilera y Décima Sexta, Quevedo, Los Ríos, Ecuador. ' +
    'Respondes en español, de forma breve, cálida y clara.\n\n' +
    'INFORMACIÓN DEL HOSPITAL:\n' +
    '- Atención 24/7, los 365 días del año (la sala de emergencias nunca cierra; ' +
    'las consultas de especialidades se agendan con cita previa).\n' +
    '- Teléfono fijo: 05 276 1490. WhatsApp (y línea de ambulancia): +593 96 339 0400.\n' +
    '- Especialidades médicas: Medicina General, Medicina Interna, Ginecología, ' +
    'Pediatría, Traumatología, Coloproctología, Urología, Cardiología, Nutrición, ' +
    'Psicología, Cirugía General, Anestesiología, Endocrinología, Nefrología, ' +
    'Fisioterapia, Odontología, Gastroenterología.\n' +
    '- Servicios adicionales: Radiografía, Ecografía, Laboratorio Clínico (SmartLab), ' +
    'Ambulancias, Emergencias 24/7.\n' +
    '- También ofrecen: Plan de Maternidad (control prenatal, parto, pediatría del ' +
    'recién nacido), paquetes preventivos/chequeos médicos, y convenios con ' +
    'aseguradoras privadas.\n\n' +
    'CÓMO AGENDAR UNA CITA: no hay reservas automáticas en línea. El paciente debe ' +
    'entrar a hospitalbravo.com/citas.html, llenar un formulario corto (nombre, ' +
    'teléfono, especialidad), y al enviarlo se abre WhatsApp con esos datos ya ' +
    'listos para mandar al +593 96 339 0400; el equipo del hospital confirma fecha ' +
    'y hora por ese medio. También pueden escribir directo a ese WhatsApp.\n\n' +
    'REGLAS IMPORTANTES:\n' +
    '- Nunca des diagnósticos médicos, indiques tratamientos ni interpretes síntomas ' +
    'como si fueras un médico. Si preguntan algo clínico, orienta a agendar una cita ' +
    'o, si suena urgente, a acudir de inmediato a Emergencias o llamar al hospital.\n' +
    '- Si alguien describe una emergencia médica real, dile claramente que venga ' +
    'de inmediato a Hospital Bravo o llame al +593 96 339 0400 — no lo hagas esperar ' +
    'la respuesta del chat.\n' +
    '- Si no sabes algo (precios exactos, disponibilidad de un médico específico, ' +
    'resultados de exámenes), dilo con honestidad y recomienda escribir por ' +
    'WhatsApp al +593 96 339 0400 para confirmarlo con el equipo.\n' +
    '- No inventes información que no esté aquí arriba.';

  const contents = [
    ...history.map((h) => ({
      role: h.role === 'bot' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
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
