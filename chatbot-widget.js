/**
 * Widget de chatbot — pégalo antes de </body> en tu HTML:
 * <script src="chatbot-widget.js"></script>
 *
 * Cambia BACKEND_URL por la URL de tu función desplegada en Vercel.
 */
(function () {
  const BACKEND_URL = 'https://TU-PROYECTO.vercel.app/api/chat'; // <-- CAMBIA ESTO

  const history = [];

  // ---- estilos ----
  const style = document.createElement('style');
  style.textContent = `
    #cb-toggle {
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%; border: none;
      background: #4f46e5; color: #fff; font-size: 24px; cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
    }
    #cb-window {
      position: fixed; bottom: 88px; right: 20px; z-index: 9999;
      width: 320px; max-width: 90vw; height: 420px; max-height: 70vh;
      background: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,.25);
      display: none; flex-direction: column; overflow: hidden; font-family: system-ui, sans-serif;
    }
    #cb-window.open { display: flex; }
    #cb-header { background: #4f46e5; color: #fff; padding: 12px 16px; font-weight: 600; }
    #cb-messages { flex: 1; overflow-y: auto; padding: 12px; font-size: 14px; }
    #cb-messages .msg { margin-bottom: 10px; line-height: 1.4; }
    #cb-messages .user { text-align: right; color: #4f46e5; }
    #cb-messages .bot { text-align: left; color: #333; }
    #cb-input-row { display: flex; border-top: 1px solid #eee; }
    #cb-input { flex: 1; border: none; padding: 10px; font-size: 14px; outline: none; }
    #cb-send { border: none; background: #4f46e5; color: #fff; padding: 0 14px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // ---- estructura ----
  const toggle = document.createElement('button');
  toggle.id = 'cb-toggle';
  toggle.textContent = '💬';
  document.body.appendChild(toggle);

  const win = document.createElement('div');
  win.id = 'cb-window';
  win.innerHTML = `
    <div id="cb-header">Asistente</div>
    <div id="cb-messages"></div>
    <div id="cb-input-row">
      <input id="cb-input" type="text" placeholder="Escribe tu mensaje..." />
      <button id="cb-send">➤</button>
    </div>
  `;
  document.body.appendChild(win);

  const messagesEl = win.querySelector('#cb-messages');
  const inputEl = win.querySelector('#cb-input');
  const sendBtn = win.querySelector('#cb-send');

  toggle.addEventListener('click', () => win.classList.toggle('open'));

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function send() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    addMessage(text, 'user');
    history.push({ role: 'user', text });

    addMessage('...', 'bot');
    const loadingEl = messagesEl.lastChild;

    try {
      const r = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await r.json();
      loadingEl.textContent = data.reply || data.error || 'Error';
      history.push({ role: 'bot', text: loadingEl.textContent });
    } catch (e) {
      loadingEl.textContent = 'Error de conexión, intenta de nuevo.';
    }
  }

  sendBtn.addEventListener('click', send);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send();
  });
})();
