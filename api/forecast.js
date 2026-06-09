module.exports = async (req, res) => {
  // Налаштування CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Обробка OPTIONS запиту для CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'Ти компетентний директор. Проаналізуй масив угод. Перевірни ТІЛЬКИ валідний JSON у форматі {"insight": "твоя коротка порада українською", "expectedTotal": число} без маркдаунy.'
          },
          {
            role: 'user',
            content: JSON.stringify(clients)
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
};
