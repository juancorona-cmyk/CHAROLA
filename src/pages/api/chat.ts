import type { APIRoute } from 'astro';
import { saveExchange } from '../../lib/chatStorage';

export const prerender = false;

const SYSTEM_PROMPT = `Eres Bot855, asistente virtual de 100% Naturizable® (tu nombre viene de la Charola 855, primer producto de la marca).
Responde siempre en el idioma del usuario (español o inglés). Sé conciso, amable y directo al punto.
IMPORTANTE: No te presentes ni saludes al inicio de cada respuesta. Ve directo a la información solicitada.
Usa solo HTML mínimo: <strong>, <a href="...">, <br>. Sin markdown, sin listas HTML, sin párrafos.
Respuestas cortas: 2-3 oraciones máximo. Si no tienes datos exactos, sugiere contacto directo.
WHATSAPP: Cuando el tema sea ventas, precios, muestras, pilotos, pedidos, cotizaciones, contacto o el usuario quiera hablar con alguien del equipo, añade exactamente [WA] al final de tu respuesta (nada más, sin explicación).

SOBRE NATURIZABLE:
Primera marca mexicana de empaque 100% plant-based. Fibra de celulosa pura, ingeniería suiza.
Parte de Grupo Ortiz México. Sede: Belisario Domínguez 30, Morelia, Michoacán, México.
Oficina en San Antonio, TX 78258, USA.

PRODUCTOS:
• Charola 855 (DISPONIBLE): charola de celulosa para carnicería, frutería y food service. 10 paquetes / 510 piezas por caja.
• Vasos de Celulosa (EN DESARROLLO): bebidas frías y calientes, sin plástico ni PFAS.
• Contenedores Take-Away (EN DESARROLLO): delivery y comida para llevar, resistentes al calor.

TECNOLOGÍA:
Recubrimiento patentado FDA-approved. Barrera anti-grasa hasta 90 minutos. Sin PFAS, sin plásticos, sin sintéticos.
100% fibra de celulosa pura. Reciclable con papel. Compostable industrial.

ALIADOS: Lonely Whale, Tom Ford Plastic Innovation Prize, Naciones Unidas (ODS 12, 14, 15), BBVA.

CONTACTO:
• Email general: info@naturizable.com
• Ventas/cotizaciones: ventas@naturizable.com
• WhatsApp: +52 443 115 1629
• Teléfono: +52 (443) 207-2593

PRECIOS: Dependen de volumen y región. Contactar ventas@naturizable.com.
MUESTRAS: Disponibles para compradores serios. Email a ventas@naturizable.com con volumen estimado.
EMBAJADORES: Programa por invitación. Sueldo mensual, producto ilimitado. Email: info@naturizable.com.`;

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ reply: 'Servicio no disponible. Escríbenos a <a href="mailto:info@naturizable.com">info@naturizable.com</a>.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { message: string; history?: { role: string; content: string }[]; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  const { message, history = [], sessionId = 'unknown' } = body;
  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-8),
    { role: 'user', content: message.trim() },
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 220,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('OpenAI error:', err);
      return new Response(
        JSON.stringify({ reply: 'No pude responder en este momento. Escríbenos a <a href="mailto:info@naturizable.com">info@naturizable.com</a>.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? 'Lo siento, intenta de nuevo.';

    try {
      saveExchange(sessionId, message.trim(), reply);
    } catch (e) {
      console.error('Storage error:', e);
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Chat error:', e);
    return new Response(
      JSON.stringify({ reply: 'Error de conexión. Escríbenos a <a href="mailto:info@naturizable.com">info@naturizable.com</a>.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
