/**
 * SnapType Command Palette Overlay
 * Triggered by Cmd+Shift+Space (Mac) or Ctrl+Shift+Space (Windows/Linux)
 * Provides quick snippet search and insertion without leaving the page
 */
(() => {
  let overlay = null;
  let snippets = [];
  let filteredSnippets = [];
  let selectedIndex = 0;
  let targetElement = null;
  let customVars = {};

  function loadSnippets() {
    chrome.storage.local.get(['snippets', 'settings'], (result) => {
      snippets = result.snippets || [];
      customVars = (result.settings && result.settings.customVars) || {};
    });
  }

  loadSnippets();
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.snippets) snippets = changes.snippets.newValue || [];
    if (changes.settings) customVars = (changes.settings.newValue && changes.settings.newValue.customVars) || {};
  });

  // Listen for keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      if (overlay) {
        closeOverlay();
      } else {
        targetElement = document.activeElement;
        openOverlay();
      }
    }
  });

  function openOverlay() {
    if (overlay) return;

    filteredSnippets = [...snippets];
    selectedIndex = 0;

    overlay = document.createElement('div');
    overlay.id = 'snaptype-overlay';
    overlay.innerHTML = `
      <div class="snaptype-overlay-backdrop"></div>
      <div class="snaptype-overlay-panel">
        <div class="snaptype-overlay-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" id="snaptype-overlay-input" placeholder="Search snippets..." autocomplete="off" spellcheck="false">
          <kbd>esc</kbd>
        </div>
        <div class="snaptype-overlay-list" id="snaptype-overlay-list"></div>
        <div class="snaptype-overlay-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> insert</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    `;

    // Inject styles
    if (!document.getElementById('snaptype-overlay-styles')) {
      const style = document.createElement('style');
      style.id = 'snaptype-overlay-styles';
      style.textContent = `
        #snaptype-overlay { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: flex-start; justify-content: center; padding-top: 20vh; }
        .snaptype-overlay-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); }
        .snaptype-overlay-panel {
          position: relative; width: 480px; max-height: 420px; background: white;
          border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          display: flex; flex-direction: column; overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: snaptype-slide-in 0.15s ease-out;
        }
        @keyframes snaptype-slide-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .snaptype-overlay-search {
          display: flex; align-items: center; gap: 10px; padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .snaptype-overlay-search input {
          flex: 1; border: none; outline: none; font-size: 15px;
          font-family: inherit; color: #1e1b4b; background: transparent;
        }
        .snaptype-overlay-search input::placeholder { color: #d1d5db; }
        .snaptype-overlay-search kbd, .snaptype-overlay-footer kbd {
          display: inline-block; background: #f3f4f6; color: #6b7280;
          padding: 2px 6px; border-radius: 4px; font-size: 11px;
          font-family: -apple-system, sans-serif; border: 1px solid #e5e7eb;
        }
        .snaptype-overlay-list { flex: 1; overflow-y: auto; padding: 6px; }
        .snaptype-overlay-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 8px; cursor: pointer; transition: background 0.08s;
        }
        .snaptype-overlay-item:hover, .snaptype-overlay-item.selected { background: #eef2ff; }
        .snaptype-overlay-item .st-shortcut {
          flex-shrink: 0; background: #eef2ff; color: #4f46e5;
          padding: 3px 8px; border-radius: 4px; font-size: 12px;
          font-weight: 600; font-family: 'SF Mono', monospace; min-width: 60px; text-align: center;
        }
        .snaptype-overlay-item.selected .st-shortcut { background: #6366f1; color: white; }
        .snaptype-overlay-item .st-preview {
          flex: 1; font-size: 13px; color: #374151;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .snaptype-overlay-item .st-folder {
          font-size: 10px; color: #9ca3af; background: #f9fafb;
          padding: 2px 6px; border-radius: 3px;
        }
        .snaptype-overlay-footer {
          display: flex; gap: 16px; justify-content: center;
          padding: 8px 16px; border-top: 1px solid #f3f4f6;
          font-size: 11px; color: #9ca3af;
        }
        .snaptype-overlay-empty {
          padding: 32px; text-align: center; color: #9ca3af; font-size: 14px;
        }
        .snaptype-overlay-list::-webkit-scrollbar { width: 4px; }
        .snaptype-overlay-list::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    const input = document.getElementById('snaptype-overlay-input');
    input.focus();
    input.addEventListener('input', handleOverlaySearch);
    input.addEventListener('keydown', handleOverlayKeys);
    overlay.querySelector('.snaptype-overlay-backdrop').addEventListener('click', closeOverlay);

    renderOverlayList();
  }

  function closeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
      if (targetElement) targetElement.focus();
    }
  }

  function handleOverlaySearch(e) {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      filteredSnippets = [...snippets];
    } else {
      filteredSnippets = snippets.filter(s =>
        s.shortcut.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        (s.folder || '').toLowerCase().includes(q)
      );
    }
    selectedIndex = 0;
    renderOverlayList();
  }

  function handleOverlayKeys(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeOverlay();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredSnippets.length - 1);
      renderOverlayList();
      scrollToSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderOverlayList();
      scrollToSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSnippets[selectedIndex]) {
        insertSnippet(filteredSnippets[selectedIndex]);
      }
    }
  }

  function scrollToSelected() {
    const list = document.getElementById('snaptype-overlay-list');
    const item = list.children[selectedIndex];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }

  function renderOverlayList() {
    const list = document.getElementById('snaptype-overlay-list');
    if (filteredSnippets.length === 0) {
      list.innerHTML = '<div class="snaptype-overlay-empty">No snippets found</div>';
      return;
    }

    list.innerHTML = filteredSnippets.map((s, i) => `
      <div class="snaptype-overlay-item ${i === selectedIndex ? 'selected' : ''}" data-index="${i}">
        <span class="st-shortcut">${escapeHtml(s.shortcut || '—')}</span>
        <span class="st-preview">${escapeHtml(s.content.substring(0, 80))}</span>
        ${s.folder ? `<span class="st-folder">${escapeHtml(s.folder)}</span>` : ''}
      </div>
    `).join('');

    list.querySelectorAll('.snaptype-overlay-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index);
        insertSnippet(filteredSnippets[idx]);
      });
      item.addEventListener('mouseenter', () => {
        selectedIndex = parseInt(item.dataset.index);
        renderOverlayList();
      });
    });
  }

  function insertSnippet(snippet) {
    closeOverlay();

    if (!targetElement) return;

    const content = processVariables(snippet.content);

    if (targetElement.isContentEditable) {
      targetElement.focus();
      document.execCommand('insertText', false, content);
    } else if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
      targetElement.focus();
      const start = targetElement.selectionStart;
      const end = targetElement.selectionEnd;
      const before = targetElement.value.substring(0, start);
      const after = targetElement.value.substring(end);
      targetElement.value = before + content + after;
      const newPos = start + content.length;
      targetElement.selectionStart = newPos;
      targetElement.selectionEnd = newPos;
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    chrome.runtime.sendMessage({ type: 'SNIPPET_USED', snippetId: snippet.id });
  }

  function processVariables(text) {
    const now = new Date();
    const vars = {
      '{date}': now.toLocaleDateString(),
      '{time}': now.toLocaleTimeString(),
      '{day}': now.toLocaleDateString('en-US', { weekday: 'long' }),
      '{month}': now.toLocaleDateString('en-US', { month: 'long' }),
      '{year}': now.getFullYear().toString(),
      '{domain}': window.location.hostname
    };
    for (const [key, value] of Object.entries(customVars)) {
      vars[`{${key}}`] = value;
    }
    let processed = text;
    for (const [key, value] of Object.entries(vars)) {
      processed = processed.split(key).join(value);
    }
    return processed.replace('{cursor}', '');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
