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
    const userMessage = req.body?.message;

    if (!Array.isArray(clients) || clients.length > 1000) {
      return res.status(400).json({ error: 'Invalid clients payload' });
    }

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'Invalid message' });
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
            content: 'Ти — розумний CRM асистент. Твоє завдання — аналізувати надані JSON дані клієнтів і відповідати на запитання користувача. Відповідай коротко, по суті, українською мовою. Не вигадуй дані, спирайся лише на наданий масив.'
          },
          {
            role: 'user',
            content: `Ось поточні дані CRM: ${JSON.stringify(clients)}\n\nМоє запитання: ${userMessage}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      console.error('❌ [OPENROUTER ERROR]:', errData);
      return res.status(response.status).json({
        error: 'OpenRouter API Error',
        details: errData
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ reply: content });
  } catch (error) {
    console.error('🔥 [SERVER ERROR]:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
