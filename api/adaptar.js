export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { mensaje, nivel } = req.body;

  const instrucciones = {
    1: 'Nivel 1: oraciones de máximo cuatro palabras. Una sola acción por paso. Sin palabras difíciles.',
    2: 'Nivel 2: oraciones cortas de hasta ocho palabras. Podés usar dos pasos seguidos si están bien numerados.',
    3: 'Nivel 3: podés usar oraciones un poco más largas, pero siempre claras y concretas. Podés incluir una breve explicación del porqué de cada cambio.'
  };

  const SYSTEM_PROMPT = `Sos un asistente especializado en comunicación para personas con Trastorno del Espectro Autista (TEA). Usás siempre español rioplatense.

Tu tarea es transformar mensajes cotidianos en mensajes claros, simples y predecibles, siguiendo estas reglas:
1. Usá una sola idea por oración.
2. Numerá los pasos cuando hay una secuencia de acciones.
3. Siempre anticipá lo que va a pasar antes de que pase.
4. Nunca uses negaciones directas. En cambio, decí qué SÍ va a pasar.
5. Si hay un cambio de plan, nombralo primero con claridad y explicá qué viene en su lugar.
6. Usá lenguaje concreto. Evitá metáforas, ironías o frases abstractas.
7. Usá tiempo presente o futuro inmediato. Evitá el condicional.
8. Al final, agregá una frase corta de cierre que transmita calma.

Respondé únicamente con el mensaje adaptado. Sin explicaciones ni comentarios.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `${instrucciones[nivel] || instrucciones[1]}\nMensaje original: "${mensaje}"` }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data?.error?.message || 'Error de API' });

    const texto = data.content?.find(b => b.type === 'text')?.text || '';
    return res.status(200).json({ texto });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
