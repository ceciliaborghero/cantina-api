const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let parsed = req.body;
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    const { cellar = [], favorites = [], topCategory = 'Rosso', totalCount = 0 } = parsed || {};

    const prompt = `Sei un sommelier esperto. Un utente ha una cantina con ${totalCount} vini.

I suoi vini preferiti (max 6):
${favorites.map(w => `- ${w.name} (${w.category}, voto: ${w.rating}/5)`).join('\n') || 'Nessuno ancora'}

I vini meglio valutati in cantina (max 12):
${cellar.map(w => `- ${w.name} (${w.category}, voto: ${w.rating}/5)`).join('\n') || 'Nessuno ancora'}

Categoria preferita: ${topCategory}

Suggerisci UN vino reale che potrebbe piacergli, diverso da quelli gia in cantina.
Rispondi SOLO con un JSON valido, senza markdown, senza backtick, esattamente cosi:
{
  "name": "nome del vino",
  "producer": "nome del produttore",
  "region": "regione e paese",
  "year": "annata consigliata (es. 2020)",
  "description": "una frase breve e poetica sul vino (max 12 parole)",
  "where": "dove trovarlo (es. Enoteca, Amazon, Vivino)",
  "reason": "perche lo consiglio (max 6 parole)"
}`;

    const apiKey = process.env.GROQ_API_KEY;
    const groqBody = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.7
    });

    const rawResult = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(groqBody)
        }
      };

      const req2 = https.request(options, (resp) => {
        let data = '';
        resp.on('data', chunk => data += chunk);
        resp.on('end', () => resolve(data));
      });
      req2.on('error', reject);
      req2.write(groqBody);
      req2.end();
    });

    console.log('Groq raw response:', rawResult);
    const groqData = JSON.parse(rawResult);

    if (groqData.error) {
      return res.status(500).json({ error: groqData.error.message });
    }

    const text = groqData.choices[0].message.content.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    res.json(data);

  } catch (err) {
    console.error('Errore:', err.message);
    res.status(500).json({ error: err.message });
  }
};
