(function () {
  const CHAT_ENDPOINT = '/api/chat';
  const MAX_HISTORY = 10;
  const BOT_NAME = '너즐 도우미';
  const WELCOME_MESSAGE =
    '안녕하세요! 너즐퍼즐의 상담봇 너즐 도우미예요 🐾\n반려동물 식품이나 파트너십에 대해 궁금한 점을 물어보세요.';

  const COLORS = {
    navy: '#1B3A5C',
    green: '#006935',
    greenDark: '#00582c',
    orange: '#E37721',
    cream: '#F5F0E8',
  };

  let history = [];
  const sessionId = getOrCreateSessionId();

  function getOrCreateSessionId() {
    const STORAGE_KEY = 'nzp_chat_session_id';
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
  }
  let isLoading = false;
  let panelOpen = false;
  let hasOpenedOnce = false;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #nzp-chat-root, #nzp-chat-root * { box-sizing: border-box; font-family: 'Pretendard', 'Inter', sans-serif; }

      #nzp-chat-root {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 9999;
      }

      #nzp-chat-toggle {
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: ${COLORS.green};
        color: #fff;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 10px 24px rgba(27,58,92,.28);
        transition: transform .2s ease, background .2s ease;
      }
      #nzp-chat-toggle:hover {
        background: ${COLORS.greenDark};
        transform: scale(1.05);
      }
      #nzp-chat-toggle svg { width: 26px; height: 26px; }

      #nzp-chat-panel {
        position: absolute;
        right: 0;
        bottom: 74px;
        width: 360px;
        max-width: calc(100vw - 40px);
        height: 520px;
        max-height: calc(100vh - 140px);
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 20px 48px rgba(27,58,92,.22);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: translateY(16px) scale(.96);
        opacity: 0;
        pointer-events: none;
        transition: transform .22s ease, opacity .22s ease;
      }
      #nzp-chat-panel.nzp-open {
        transform: translateY(0) scale(1);
        opacity: 1;
        pointer-events: auto;
      }

      #nzp-chat-header {
        background: ${COLORS.navy};
        color: ${COLORS.cream};
        padding: 16px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      #nzp-chat-header-title { font-weight: 700; font-size: 15px; }
      #nzp-chat-header-sub { font-size: 12px; color: rgba(245,240,232,.65); margin-top: 2px; }
      #nzp-chat-close {
        background: transparent;
        border: none;
        color: ${COLORS.cream};
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
        padding: 4px;
        opacity: .8;
      }
      #nzp-chat-close:hover { opacity: 1; }

      #nzp-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: ${COLORS.cream};
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .nzp-msg {
        max-width: 82%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 13.5px;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .nzp-msg-bot {
        align-self: flex-start;
        background: #fff;
        color: ${COLORS.navy};
        border: 1px solid rgba(27,58,92,.10);
        border-bottom-left-radius: 4px;
      }
      .nzp-msg-user {
        align-self: flex-end;
        background: ${COLORS.green};
        color: #fff;
        border-bottom-right-radius: 4px;
      }
      .nzp-msg-error {
        align-self: flex-start;
        background: #fdeceb;
        color: #b3261e;
        border: 1px solid rgba(179,38,30,.18);
        border-bottom-left-radius: 4px;
      }

      .nzp-typing {
        align-self: flex-start;
        display: flex;
        gap: 4px;
        padding: 12px 14px;
        background: #fff;
        border: 1px solid rgba(27,58,92,.10);
        border-radius: 14px;
        border-bottom-left-radius: 4px;
      }
      .nzp-typing span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${COLORS.navy};
        opacity: .35;
        animation: nzp-bounce 1.1s infinite ease-in-out;
      }
      .nzp-typing span:nth-child(2) { animation-delay: .15s; }
      .nzp-typing span:nth-child(3) { animation-delay: .3s; }
      @keyframes nzp-bounce {
        0%, 60%, 100% { transform: translateY(0); opacity: .35; }
        30% { transform: translateY(-4px); opacity: .9; }
      }

      #nzp-chat-form {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: #fff;
        border-top: 1px solid rgba(27,58,92,.08);
        flex-shrink: 0;
      }
      #nzp-chat-input {
        flex: 1;
        border: 1px solid rgba(27,58,92,.18);
        border-radius: 50px;
        padding: 10px 16px;
        font-size: 13.5px;
        outline: none;
        color: ${COLORS.navy};
      }
      #nzp-chat-input:focus { border-color: ${COLORS.green}; }
      #nzp-chat-send {
        background: ${COLORS.green};
        color: #fff;
        border: none;
        border-radius: 50px;
        padding: 0 18px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background .2s ease;
      }
      #nzp-chat-send:hover { background: ${COLORS.greenDark}; }
      #nzp-chat-send:disabled { opacity: .5; cursor: not-allowed; }

      @media (max-width: 480px) {
        #nzp-chat-panel {
          width: calc(100vw - 40px);
          right: 0;
          bottom: 72px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildWidget() {
    const root = document.createElement('div');
    root.id = 'nzp-chat-root';
    root.innerHTML = `
      <div id="nzp-chat-panel" role="dialog" aria-label="너즐 도우미 챗봇">
        <div id="nzp-chat-header">
          <div>
            <div id="nzp-chat-header-title">🐾 ${BOT_NAME}</div>
            <div id="nzp-chat-header-sub">너즐퍼즐 상담 챗봇</div>
          </div>
          <button id="nzp-chat-close" aria-label="닫기">✕</button>
        </div>
        <div id="nzp-chat-messages"></div>
        <form id="nzp-chat-form">
          <input id="nzp-chat-input" type="text" placeholder="메시지를 입력하세요" autocomplete="off" />
          <button id="nzp-chat-send" type="submit">전송</button>
        </form>
      </div>
      <button id="nzp-chat-toggle" aria-label="채팅 열기">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4h16v12H7l-3 3V4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    document.body.appendChild(root);
    return root;
  }

  function appendMessage(role, text) {
    const messagesEl = document.getElementById('nzp-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `nzp-msg ${role === 'user' ? 'nzp-msg-user' : 'nzp-msg-bot'}`;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function appendError(text) {
    const messagesEl = document.getElementById('nzp-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = 'nzp-msg nzp-msg-error';
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const messagesEl = document.getElementById('nzp-chat-messages');
    const typing = document.createElement('div');
    typing.className = 'nzp-typing';
    typing.id = 'nzp-typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('nzp-typing-indicator');
    if (typing) typing.remove();
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;

    appendMessage('user', text);
    history.push({ role: 'user', content: text });
    history = history.slice(-MAX_HISTORY);

    isLoading = true;
    document.getElementById('nzp-chat-send').disabled = true;
    showTyping();

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId }),
      });

      if (!res.ok) throw new Error('서버 응답 오류');

      const data = await res.json();
      hideTyping();

      if (!data.reply) throw new Error('빈 응답');

      appendMessage('bot', data.reply);
      history.push({ role: 'assistant', content: data.reply });
      history = history.slice(-MAX_HISTORY);
    } catch (err) {
      hideTyping();
      appendError('죄송해요, 잠시 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      isLoading = false;
      document.getElementById('nzp-chat-send').disabled = false;
    }
  }

  function openPanel() {
    panelOpen = true;
    document.getElementById('nzp-chat-panel').classList.add('nzp-open');
    if (!hasOpenedOnce) {
      hasOpenedOnce = true;
      appendMessage('bot', WELCOME_MESSAGE);
    }
    setTimeout(() => document.getElementById('nzp-chat-input').focus(), 150);
  }

  function closePanel() {
    panelOpen = false;
    document.getElementById('nzp-chat-panel').classList.remove('nzp-open');
  }

  function init() {
    injectStyles();
    buildWidget();

    document.getElementById('nzp-chat-toggle').addEventListener('click', () => {
      panelOpen ? closePanel() : openPanel();
    });
    document.getElementById('nzp-chat-close').addEventListener('click', closePanel);

    document.getElementById('nzp-chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('nzp-chat-input');
      const text = input.value;
      input.value = '';
      sendMessage(text);
    });

    setTimeout(() => {
      if (!panelOpen) openPanel();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
