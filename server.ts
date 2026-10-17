import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '30mb' }));

// API route to parse sports betting tickets using Gemini 3.8 Flash Vision with Few-Shot Training
app.post('/api/parse-ticket', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Falta la imagen' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Eres un sistema experto en extracción OCR de boletos y comprobantes de apuestas deportivas (formato 1xBet / Betwinner / Melbet / casas de apuestas).

Tu tarea es analizar la captura del ticket y devolver un JSON con esta estructura exacta:
{
  "event": "Nombre limpio del partido y la selección de mercado",
  "odds": "Cuota general del ticket (con coma como separador decimal)",
  "stake": "Importe de la apuesta (número con coma si tiene decimales)",
  "date": "Fecha del ticket en formato DD/MM/AAAA"
}

REGLAS DE EXTRACCIÓN:
1. Cuota (odds): Extrae el valor de 'Cuota:' del resumen principal (ejemplos: '1,6', '1,92', '1,48', '1,53', '1,799', '1,779', '1,605'). Usa siempre coma para los decimales.
2. Apostado (stake): Extrae el valor de 'Apuesta:' del resumen principal (ejemplos: '150', '50', '55,65', '86,5', '100', '200'). Ignora 'Posibles ganancias'.
3. Fecha (date): Extrae la fecha que aparece arriba a la izquierda del ticket (ejemplo '06.09.2026' -> '06/09/2026', '16.10.2026' -> '16/10/2026', '30.09.2026' -> '30/09/2026'). Formato DD/MM/AAAA.
4. Apuesta (event):
   - Si es apuesta SIMPLE: Combina [Equipo1] vs [Equipo2] - [Mercado / Selección].
     * Si los equipos tienen 'VS' entre medio: 'JEF United Ichihara Chiba vs Gamba Osaka - Ambos equipos anotarán. Sí'.
     * Si el partido está en DIRECTO con marcador (ej. '0 : 1' o '2 : 0'): reemplaza el marcador por 'vs' ('Defensa y Justicia vs Instituto Córdoba - Total 1. Más de (0.5)' o 'Boca Juniors De Cali vs Atlético Club - Total. Más de (2)' o 'Lituania vs Andorra - Total. Más de (2.5)').
     * NUNCA incluyas texto de estado como 'EN DIRECTO', 'tiempo transcurrido: XX:XX', 'Aceptada', o número de ticket.
   - Si es apuesta COMBINADA (múltiples eventos): Une cada evento con ' + ':
     Ejemplo: 'Fadzhiano Okayama vs Sanfrecce Hiroshima - Total. Más de (1.5) + FC Kashiwa Reysol vs Yokohama F. Marinos - Total 2. Más de (0.5)'.

EJEMPLOS DE ENTRENAMIENTO:
- Ticket J-League: 'JEF United Ichihara Chiba vs Gamba Osaka - Ambos equipos anotarán. Sí', Cuota: '1,6', Apostado: '150', Fecha: '06/09/2026'
- Ticket Argentina: 'Defensa y Justicia vs Instituto Córdoba - Total 1. Más de (0.5)', Cuota: '1,92', Apostado: '50', Fecha: '16/10/2026'
- Ticket Colombia: 'Boca Juniors De Cali vs Atlético Club - Total. Más de (2)', Cuota: '1,48', Apostado: '55,65', Fecha: '16/10/2026'
- Ticket NBA: 'Los Angeles Lakers vs Golden State Warriors - Total. Menos de (239.5). Prórroga incluída', Cuota: '1,53', Apostado: '86,5', Fecha: '14/10/2026'
- Ticket Cerezo Osaka: 'FC Kerez Osaka vs FC Tokyo Verdy - 1X2 (2UP). G1', Cuota: '1,799', Apostado: '100', Fecha: '06/09/2026'
- Ticket Combinada 2 eventos: 'Fadzhiano Okayama vs Sanfrecce Hiroshima - Total. Más de (1.5) + FC Kashiwa Reysol vs Yokohama F. Marinos - Total 2. Más de (0.5)', Cuota: '1,779', Apostado: '150', Fecha: '06/09/2026'
- Ticket Lituania vs Andorra: 'Lituania vs Andorra - Total. Más de (2.5)', Cuota: '1,605', Apostado: '200', Fecha: '30/09/2026'

Devuelve ÚNICAMENTE el objeto JSON sin comillas invertidas ni markdown.`;

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/png',
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error al analizar ticket con Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error al analizar imagen' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`QuantBet corriendo en http://0.0.0.0:${port}`);
  });
}

startServer();
