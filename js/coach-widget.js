/**
 * Coach CR7 — Floating Hybrid RAG AI Fitness Coach Widget
 * Persists chat history & open state in sessionStorage across pages.
 * Uses window.api (js/api.js) to call POST /api/v1/coach/chat.
 */
(function () {
  const STORAGE_HISTORY_KEY = 'pulseai_cr7_history';
  const STORAGE_OPEN_KEY = 'pulseai_cr7_open';
  const QUICK_PROMPTS = [
    'Fix my macro gap today',
    'Plan my next workout',
    'Rate my discipline this week',
  ];

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      // Keep last 20 messages in sessionStorage to stay lightweight
      sessionStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history.slice(-20)));
    } catch {
      // Ignore storage quota errors
    }
  }

  function loadOpenState() {
    return sessionStorage.getItem(STORAGE_OPEN_KEY) === 'true';
  }

  function saveOpenState(isOpen) {
    sessionStorage.setItem(STORAGE_OPEN_KEY, isOpen ? 'true' : 'false');
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCoachText(text) {
    // Safe minimal markdown: **bold** and line breaks after escaping HTML
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function initWidget() {
    if (document.getElementById('cr7-coach-root')) return;

    const root = document.createElement('div');
    root.id = 'cr7-coach-root';
    root.className = 'cr7-widget-root';

    root.innerHTML = `
      <div class="cr7-panel" id="cr7-panel" role="dialog" aria-label="Coach CR7 AI Fitness Chat" aria-hidden="true">
        <div class="cr7-header">
          <div class="cr7-header-left">
            <span class="cr7-avatar" aria-hidden="true">CR7</span>
            <div>
              <div class="cr7-title">COACH CR7</div>
              <div class="cr7-subtitle">HYBRID RAG // LIVE STATS</div>
            </div>
          </div>
          <div class="cr7-header-actions">
            <button type="button" class="cr7-icon-btn" id="cr7-clear-btn" title="Clear chat" aria-label="Clear chat">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
              </svg>
            </button>
            <button type="button" class="cr7-icon-btn" id="cr7-close-btn" title="Minimize" aria-label="Close Coach CR7">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="cr7-messages" id="cr7-messages"></div>

        <div class="cr7-chips" id="cr7-chips">
          ${QUICK_PROMPTS.map(
            (prompt) => `<button type="button" class="cr7-chip" data-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`
          ).join('')}
        </div>

        <form class="cr7-form" id="cr7-form">
          <input
            type="text"
            class="cr7-input"
            id="cr7-input"
            placeholder="Ask Coach CR7..."
            maxlength="1000"
            autocomplete="off"
          />
          <button type="submit" class="cr7-send-btn" id="cr7-send-btn" aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>

      <button type="button" class="cr7-fab" id="cr7-fab" aria-expanded="false" aria-controls="cr7-panel">
        <span class="cr7-fab-dot" aria-hidden="true"></span>
        <span class="cr7-fab-label">CR7 Coach</span>
      </button>
    `;

    document.body.appendChild(root);

    const panel = document.getElementById('cr7-panel');
    const fab = document.getElementById('cr7-fab');
    const closeBtn = document.getElementById('cr7-close-btn');
    const clearBtn = document.getElementById('cr7-clear-btn');
    const messagesEl = document.getElementById('cr7-messages');
    const chipsEl = document.getElementById('cr7-chips');
    const form = document.getElementById('cr7-form');
    const input = document.getElementById('cr7-input');
    const sendBtn = document.getElementById('cr7-send-btn');

    let history = loadHistory();
    let isSending = false;

    function renderMessages(loading = false, errorMsg = '') {
      if (history.length === 0 && !loading && !errorMsg) {
        messagesEl.innerHTML = `
          <div class="cr7-empty">
            <div class="cr7-empty-badge">CHAMPION MENTALITY</div>
            <p>No excuses today. I see your live macros and last 7 days of training. Tap a quick prompt or ask me anything.</p>
          </div>
        `;
      } else {
        let html = history
          .map((msg) => {
            const cls = msg.role === 'user' ? 'cr7-msg cr7-msg-user' : 'cr7-msg cr7-msg-assistant';
            const topicsHtml =
              msg.role === 'assistant' && Array.isArray(msg.topics) && msg.topics.length
                ? `<div class="cr7-msg-topics">${msg.topics.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>`
                : '';
            return `<div class="${cls}"><div class="cr7-bubble">${formatCoachText(msg.content)}</div>${topicsHtml}</div>`;
          })
          .join('');

        if (loading) {
          html += `
            <div class="cr7-msg cr7-msg-assistant">
              <div class="cr7-bubble cr7-typing" aria-label="Coach CR7 is thinking">
                <span></span><span></span><span></span>
              </div>
            </div>
          `;
        }

        if (errorMsg) {
          html += `<div class="cr7-error">${escapeHtml(errorMsg)}</div>`;
        }

        messagesEl.innerHTML = html;
      }
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      saveOpenState(open);
      if (open) {
        setTimeout(() => input.focus(), 120);
      }
    }

    async function sendMessage(text) {
      const trimmed = (text || '').trim();
      if (!trimmed || isSending) return;

      if (!window.api) {
        renderMessages(false, 'API client unavailable. Refresh the page.');
        return;
      }

      const historyPayload = history.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      history.push({ role: 'user', content: trimmed });
      saveHistory(history);
      input.value = '';
      isSending = true;
      sendBtn.disabled = true;
      renderMessages(true);

      try {
        const res = await window.api.post('/coach/chat', {
          message: trimmed,
          history: historyPayload,
        });

        history.push({
          role: 'assistant',
          content: res.reply,
          topics: res.retrieved_topics || [],
        });
        saveHistory(history);
        renderMessages(false);
      } catch (err) {
        renderMessages(false, err?.message || 'Unable to reach Coach CR7 right now.');
      } finally {
        isSending = false;
        sendBtn.disabled = false;
      }
    }

    fab.addEventListener('click', () => {
      setOpen(!panel.classList.contains('is-open'));
    });

    closeBtn.addEventListener('click', () => setOpen(false));

    clearBtn.addEventListener('click', () => {
      history = [];
      saveHistory(history);
      renderMessages(false);
    });

    chipsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.cr7-chip');
      if (!btn) return;
      const prompt = btn.getAttribute('data-prompt');
      if (prompt) sendMessage(prompt);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(input.value);
    });

    renderMessages(false);
    setOpen(loadOpenState());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
