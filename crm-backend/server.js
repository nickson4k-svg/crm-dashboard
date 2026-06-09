const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/api/forecast', async (req, res) => {
  try {
    const clients = req.body?.clients;
    if (!Array.isArray(clients) || clients.length > 1000) {
      return res.status(400).json({ error: 'Invalid clients payload' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {

      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/owl-alpha',
        messages: [
          {
            role: 'system',
            content:
              'Ти компетентний директор. Проаналізуй масив угод. Перевірни ТІЛЬКИ валідний JSON у форматі {"insight": "твоя коротка порада українською", "expectedTotal": число} без маркдаунy.'
          },
          {
            role: 'user',
            content: JSON.stringify(req.body.clients)
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      console.error('❌ [OPENROUTER ERROR]:', errData);
      return res.status(response.status).json({ error: 'Помилка API OpenRouter' });
    }

    const data = await response.json();
    const rawAiText = data?.choices?.[0]?.message?.content;

    console.log('🤖 [RAW AI RESPONSE]:\n', rawAiText);

    const startIndex = String(rawAiText).indexOf('{');
    const endIndex = String(rawAiText).lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1) {
      const cleanJsonString = String(rawAiText).substring(startIndex, endIndex + 1);
      let aiResult;
      try {
        aiResult = JSON.parse(cleanJsonString);
      } catch (parseError) {
        console.error('❌ [AI JSON PARSE ERROR]:', parseError);
        return res.status(500).json({ error: 'Помилка обробки відповіді від AI' });
      }
      return res.json(aiResult);
    }


    console.error('❌ [PARSE ERROR]: ШІ не повернув JSON', rawAiText);
    return res
      .status(500)
      .json({ error: 'Unexpected AI response shape', details: rawAiText });
  } catch (error) {
    console.error('❌ [SERVER ERROR]:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
});

module.exports = app;

