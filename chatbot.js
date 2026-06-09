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
      appendMessage('bot', data.reply || 'Вибачте, сталася помилка під час обробки вашого запиту.');

    } catch (error) {
      console.error('Chatbot API error:', error);
      typingEl.remove();
      appendMessage('bot', '❌ Не вдалося з\'єднатися з сервером. Спробуйте пізніше.');
    }
  });
}
