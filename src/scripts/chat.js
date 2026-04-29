(function () {
  const launcher      = document.getElementById('chatbotLauncher');
  const closeBtn      = document.getElementById('chatbotClose');
  const backBtn       = document.getElementById('chatbotBack');
  const chatbot       = document.getElementById('chatbot');
  const form          = document.getElementById('chatbotForm');
  const input         = document.getElementById('chatbotInput');
  const body          = document.getElementById('chatbotBody');
  const initialReplies = document.getElementById('chatInitialReplies');

  if (!launcher || !chatbot || !form || !input || !body) return;

  // Guard: prevent double-init if script loads more than once in dev
  if (chatbot.dataset.chatInit) return;
  chatbot.dataset.chatInit = '1';

  // Persistent session ID per browser (resets on localStorage clear)
  let sessionId = localStorage.getItem('chatSessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('chatSessionId', sessionId);
  }

  const history = [];
  let busy = false;

  function addMsg(html, type) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function addWhatsApp() {
    const a = document.createElement('a');
    a.href = 'https://wa.me/524431151629';
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'chat-wa-btn';
    a.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.553 4.099 1.522 5.82L0 24l6.335-1.49A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.864 9.864 0 01-5.031-1.378l-.36-.214-3.732.878.896-3.618-.235-.373A9.844 9.844 0 012.118 12C2.118 6.538 6.538 2.118 12 2.118c5.463 0 9.882 4.42 9.882 9.882 0 5.463-4.42 9.882-9.882 9.882z"/></svg>Chatear por WhatsApp`;
    body.appendChild(a);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'chatbot-typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
    return t;
  }

  async function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    busy = true;

    // Remove initial quick replies on first interaction
    if (initialReplies && initialReplies.parentNode) initialReplies.remove();

    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    input.value = '';

    const typing = showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-8), sessionId }),
      });

      const data = await res.json();
      typing.remove();

      let reply = data.reply || 'Lo siento, intenta de nuevo.';
      const showWA = reply.includes('[WA]');
      reply = reply.replace('[WA]', '').trim();
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
      if (history.length > 50) history.splice(0, 2);
      if (showWA) addWhatsApp();
    } catch {
      typing.remove();
      addMsg(
        'No pude conectarme. Escríbenos a <a href="mailto:info@naturizable.com">info@naturizable.com</a>.',
        'bot'
      );
    } finally {
      busy = false;
      input.focus();
    }
  }

  // Wire up static initial quick reply buttons
  if (initialReplies) {
    initialReplies.querySelectorAll('.chat-quick-reply').forEach(btn => {
      btn.addEventListener('click', () => send(btn.textContent.trim()));
    });
  }

  function openChat() {
    chatbot.classList.add('open');
    setTimeout(() => input.focus(), 100);
  }

  launcher.addEventListener('click', openChat);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      chatbot.classList.remove('open');
      return;
    }
    if (e.key === 'f' || e.key === 'F') {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      chatbot.classList.toggle('open');
      if (chatbot.classList.contains('open')) setTimeout(() => input.focus(), 100);
    }
  });

  closeBtn.addEventListener('click', () => chatbot.classList.remove('open'));
  if (backBtn) backBtn.addEventListener('click', () => chatbot.classList.remove('open'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    send(input.value);
  });
})();
