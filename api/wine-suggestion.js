const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cellar = [], favorites = [], topCategory = 'Rosso', totalCount = 0 } = req.body;

    const prompt = `Sei un sommelier esperto. Un utente ha una cantina con ${totalCount} vini.

I suoi vini preferiti (max 6):
${favorites.map(w => `- ${w.name} (${w.category}, voto: ${w.rating}/5)`).join('\n') || 'Nessuno ancora'}

I vini meglio valutati in cantina (max 12):
${cellar.map(w => `- ${w.name} (${w.category}, voto: ${w.rating}/5)`).join('\n') || 'Nessuno ancora'}

Categoria preferita: ${topCategory}

Suggerisci UN vino reale che potrebbe piacergli, diverso da quelli già in cantina.
Rispondi SOLO con un JSON valido, senza markdown, senza backtick, esattamente così:
{
  "name": "nome del vino",
  "producer": "nome del produttore",
  "region": "regione e paese",
  "year": "annata consigliata (es. 2020)",
  "description": "una frase breve e poetica sul vino (max 12 parole)",
  "where": "dove trovarlo (es. Enoteca, Amazon, Vivino)",
  "reason": "perché lo consiglio (max 6 parole)"
}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const data = JSON.parse(text);
    res.json(data);

  } catch (err) {
    console.error('Errore:', err.message);
    res.status(500).json({ error: 'Errore nella generazione del suggerimento' });
  }
};
