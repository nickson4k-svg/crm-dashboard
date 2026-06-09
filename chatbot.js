import { getClients } from './store.js';

export function initChatbot() {
  const openBtn = document.getElementById('openChatbotBtn');
  const closeBtn = document.getElementById('closeChatbotBtn');
  const widget = document.getElementById('chatbotWidget');
  const form = document.getElementById('chatbotForm');
  const input = document.getElementById('chatbotInput');
  const messagesContainer = document.getElementById('chatbotMessages');

  let isChatOpen = false;

  openBtn.addEventListener('click', () => {
    isChatOpen = true;
    widget.hidden = false;
    widget.setAttribute('aria-hidden', 'false');
    openBtn.style.display = 'none';
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    isChatOpen = false;
    widget.hidden = true;
    widget.setAttribute('aria-hidden', 'true');
    openBtn.style.display = 'flex';
  });

  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function typeMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    
    // Disable input while typing
    input.disabled = true;
    const sendBtn = form.querySelector('.chatbot-send-btn');
    if (sendBtn) sendBtn.disabled = true;

    for (let i = 0; i < text.length; i++) {
      bubble.textContent += text.charAt(i);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      // Faster typing for spaces, slightly slower for punctuation
      let delay = 15;
      const char = text.charAt(i);
      if (char === '.' || char === '!' || char === '?') delay = 150;
      else if (char === ',') delay = 50;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }

  function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message bot typing-indicator-wrapper';
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    msgDiv.appendChild(indicator);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgDiv;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage('user', userMessage);
    input.value = '';

    const typingEl = showTypingIndicator();

    try {
      // Determine base URL dynamically based on environment
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const baseUrl = isLocalhost ? 'http://localhost:3000' : 'https://crm-dashboard-eight-kappa.vercel.app';
      const apiUrl = `${baseUrl}/api/assistant`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          clients: getClients()
        })
      });

      typingEl.remove();

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      await typeMessage('bot', data.reply || 'Вибачте, сталася помилка під час обробки вашого запиту.');

    } catch (error) {
      console.error('Chatbot API error:', error);
      typingEl.remove();
      appendMessage('bot', '❌ Не вдалося з\'єднатися з сервером. Спробуйте пізніше.');
    }
  });
}
