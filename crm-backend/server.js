const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json({ limit: '1mb' }));

// Суворий CORS: тільки з твого фронтенду
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://nickson4k-svg.github.io';

// CORS + Method handling (preflight)
app.use('/api/forecast', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  return next();
});

app.post('/api/forecast', async (req, res) => {
  try {
    const { clients } = req.body || {};
    if (!Array.isArray(clients)) return res.status(400).json({ error: 'Invalid data format' });

    // 1) Ліміт 50 клієнтів + обрізаємо дані до status/value
    const limitedClients = clients.slice(0, 50);
    const optimizedData = limitedClients.map((c) => ({
      status: c?.status,
      value: c?.value ?? 0,
    }));

    const actualTotal = optimizedData
      .filter((c) => c.status === 'Won')
      .reduce((sum, c) => sum + (Number(c.value) || 0), 0);

    const fallbackExpected = actualTotal === 0 ? 5000 : actualTotal * 1.25;

    // 2) Запит до OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'You are a sales AI. Analyze pipeline. Return STRICTLY JSON: { "insight": "string", "expectedTotal": number }',
          },
          { role: 'user', content: `Data: ${JSON.stringify(optimizedData)}` },
        ],
      }),
    });

    // 3) Захист від 429: повертаємо 200 OK з заглушкою
    if (response.status === 429 || !response.ok) {
      return res.status(200).json({
        isFallback: true,
        insight:
          '⚠️ ШІ тимчасово недоступний (Перевищено ліміт запитів API). Показано базовий системний прогноз.',
        expectedTotal: fallbackExpected,
      });
    }

    const data = await response.json();
    const raw = String(data?.choices?.[0]?.message?.content ?? '');
    const aiResult = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json(JSON.parse(aiResult));
  } catch (error) {
    return res.status(200).json({
      isFallback: true,
      insight: '⚠️ Помилка форматування відповіді ШІ. Показано базовий прогноз.',
      expectedTotal: 0,
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
});

module.exports = app;

