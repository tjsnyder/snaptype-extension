(() => {
  let snippets = [];
  let buffer = '';
  let settings = { triggerKey: 'Tab', expansionEnabled: true };

  function loadSnippets() {
    chrome.storage.local.get(['snippets', 'settings'], (result) => {
      snippets = result.snippets || [];
      settings = result.settings || settings;
    });
  }

  loadSnippets();

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.snippets) snippets = changes.snippets.newValue || [];
    if (changes.settings) settings = changes.settings.newValue || settings;
  });

  function processVariables(text) {
    const now = new Date();
    const vars = {
      '{date}': now.toLocaleDateString(),
      '{time}': now.toLocaleTimeString(),
      '{day}': now.toLocaleDateString('en-US', { weekday: 'long' }),
      '{month}': now.toLocaleDateString('en-US', { month: 'long' }),
      '{year}': now.getFullYear().toString(),
      '{timestamp}': now.toISOString(),
      '{domain}': window.location.hostname
    };

    chrome.storage.local.get(['settings'], (result) => {
      const s = result.settings || {};
      if (s.customVars) {
        for (const [key, value] of Object.entries(s.customVars)) {
          vars[`{${key}}`] = value;
        }
      }
    });

    let processed = text;
    for (const [key, value] of Object.entries(vars)) {
      processed = processed.split(key).join(value);
    }
    return processed;
  }

  function expandSnippet(el, snippet, shortcutLength) {
    const expandedContent = processVariables(snippet.content);

    if (el.isContentEditable) {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      for (let i = 0; i < shortcutLength; i++) {
        document.execCommand('delete', false);
      }

      const lines = expandedContent.split('\n');
      lines.forEach((line, idx) => {
        document.execCommand('insertText', false, line);
        if (idx < lines.length - 1) {
          document.execCommand('insertLineBreak', false);
        }
      });
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const start = el.selectionStart - shortcutLength;
      const end = el.selectionStart;
      const before = el.value.substring(0, start);
      const after = el.value.substring(end);
      el.value = before + expandedContent + after;

      const newPos = start + expandedContent.length;
      el.selectionStart = newPos;
      el.selectionEnd = newPos;

      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    chrome.runtime.sendMessage({
      type: 'SNIPPET_USED',
      snippetId: snippet.id
    });

    showExpansionIndicator(el);
  }

  function showExpansionIndicator(el) {
    const rect = el.getBoundingClientRect();
    const indicator = document.createElement('div');
    indicator.textContent = 'Expanded';
    indicator.style.cssText = `
      position: fixed;
      top: ${rect.top - 28}px;
      left: ${rect.left}px;
      background: #6366f1;
      color: white;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 999999;
      pointer-events: none;
      animation: snaptype-fade 0.8s ease-out forwards;
    `;
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 800);
  }

  if (!document.getElementById('snaptype-styles')) {
    const style = document.createElement('style');
    style.id = 'snaptype-styles';
    style.textContent = `
      @keyframes snaptype-fade {
        0% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
      }
      .snaptype-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1e1b4b;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: snaptype-fade 3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('keydown', (e) => {
    if (!settings.expansionEnabled) return;

    const el = document.activeElement;
    if (!el) return;

    const isEditable = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    if (!isEditable) return;

    if (e.key === settings.triggerKey || (settings.triggerKey === 'Tab' && e.key === 'Tab')) {
      const match = snippets.find(s => s.shortcut && buffer.endsWith(s.shortcut));
      if (match) {
        e.preventDefault();
        expandSnippet(el, match, match.shortcut.length);
        buffer = '';
        return;
      }
    }

    if (e.key.length === 1) {
      buffer += e.key;
      if (buffer.length > 50) buffer = buffer.slice(-50);
    } else if (e.key === 'Backspace') {
      buffer = buffer.slice(0, -1);
    } else if (e.key === 'Escape' || e.key === 'Enter') {
      buffer = '';
    }
  }, true);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SHOW_TOAST') {
      const toast = document.createElement('div');
      toast.className = 'snaptype-toast';
      toast.textContent = message.message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  });
})();
