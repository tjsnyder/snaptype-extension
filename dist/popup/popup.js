const FREE_LIMIT = 10;
let allSnippets = [];
let editingSnippetId = null;
let settings = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const result = await chrome.storage.local.get(['snippets', 'settings', 'stats']);
  allSnippets = result.snippets || [];
  settings = result.settings || {};
  const stats = result.stats || {};

  document.getElementById('stat-expansions').textContent = `${stats.totalExpansions || 0} expansions`;
  document.getElementById('stat-keystrokes').textContent = `${stats.keystrokesSaved || 0} keystrokes saved`;

  renderSnippets(allSnippets);
  updateLimitBanner();

  document.getElementById('btn-add').addEventListener('click', openNewEditor);
  document.getElementById('btn-settings').addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.getElementById('search').addEventListener('input', handleSearch);
  document.getElementById('btn-close-editor').addEventListener('click', closeEditor);
  document.getElementById('btn-cancel-editor').addEventListener('click', closeEditor);
  document.getElementById('btn-save-snippet').addEventListener('click', saveSnippet);
  document.getElementById('btn-delete-snippet').addEventListener('click', deleteSnippet);
  document.getElementById('btn-upgrade').addEventListener('click', showUpgradeModal);
  document.getElementById('btn-buy-pro').addEventListener('click', handlePurchase);
  document.getElementById('btn-close-upgrade').addEventListener('click', () => {
    document.getElementById('upgrade-modal').style.display = 'none';
  });

  document.getElementById('search').focus();
}

function renderSnippets(snippets) {
  const list = document.getElementById('snippet-list');
  const empty = document.getElementById('empty-state');

  if (snippets.length === 0) {
    list.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  list.style.display = 'block';
  empty.style.display = 'none';

  const folders = {};
  snippets.forEach(s => {
    const f = s.folder || 'Default';
    if (!folders[f]) folders[f] = [];
    folders[f].push(s);
  });

  list.innerHTML = '';
  for (const [folderName, folderSnippets] of Object.entries(folders)) {
    if (Object.keys(folders).length > 1) {
      const header = document.createElement('div');
      header.className = 'folder-header';
      header.innerHTML = `<span class="folder-arrow">▼</span> ${escapeHtml(folderName)} (${folderSnippets.length})`;
      header.addEventListener('click', () => {
        const arrow = header.querySelector('.folder-arrow');
        const group = header.nextElementSibling;
        arrow.classList.toggle('collapsed');
        group.style.display = group.style.display === 'none' ? 'block' : 'none';
      });
      list.appendChild(header);
    }

    const group = document.createElement('div');
    group.className = 'folder-group';

    folderSnippets.forEach(snippet => {
      const card = document.createElement('div');
      card.className = 'snippet-card';
      card.addEventListener('click', () => openEditEditor(snippet));

      const shortcutEl = document.createElement('div');
      shortcutEl.className = 'snippet-shortcut';
      shortcutEl.textContent = snippet.shortcut || '—';

      const body = document.createElement('div');
      body.className = 'snippet-body';

      const preview = document.createElement('div');
      preview.className = 'snippet-preview';
      preview.textContent = snippet.content.substring(0, 80);

      const meta = document.createElement('div');
      meta.className = 'snippet-meta';
      meta.textContent = `Used ${snippet.usageCount || 0} times`;

      body.appendChild(preview);
      body.appendChild(meta);
      card.appendChild(shortcutEl);
      card.appendChild(body);
      group.appendChild(card);
    });

    list.appendChild(group);
  }
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase().trim();
  if (!q) {
    renderSnippets(allSnippets);
    return;
  }
  const filtered = allSnippets.filter(s =>
    s.shortcut.toLowerCase().includes(q) ||
    s.content.toLowerCase().includes(q) ||
    (s.folder || '').toLowerCase().includes(q)
  );
  renderSnippets(filtered);
}

function openNewEditor() {
  if (!settings.isPro && allSnippets.length >= FREE_LIMIT) {
    showUpgradeModal();
    return;
  }
  editingSnippetId = null;
  document.getElementById('editor-title').textContent = 'New Snippet';
  document.getElementById('edit-shortcut').value = '/';
  document.getElementById('edit-content').value = '';
  document.getElementById('edit-folder').value = 'Default';
  document.getElementById('btn-delete-snippet').style.display = 'none';
  document.getElementById('editor-modal').style.display = 'flex';
  document.getElementById('edit-shortcut').focus();
}

function openEditEditor(snippet) {
  editingSnippetId = snippet.id;
  document.getElementById('editor-title').textContent = 'Edit Snippet';
  document.getElementById('edit-shortcut').value = snippet.shortcut;
  document.getElementById('edit-content').value = snippet.content;
  document.getElementById('edit-folder').value = snippet.folder || 'Default';
  document.getElementById('btn-delete-snippet').style.display = 'inline-block';
  document.getElementById('editor-modal').style.display = 'flex';
  document.getElementById('edit-shortcut').focus();
}

function closeEditor() {
  document.getElementById('editor-modal').style.display = 'none';
  editingSnippetId = null;
}

async function saveSnippet() {
  const shortcut = document.getElementById('edit-shortcut').value.trim();
  const content = document.getElementById('edit-content').value;
  const folder = document.getElementById('edit-folder').value.trim() || 'Default';

  if (!content) {
    document.getElementById('edit-content').style.borderColor = '#ef4444';
    return;
  }

  if (editingSnippetId) {
    const idx = allSnippets.findIndex(s => s.id === editingSnippetId);
    if (idx !== -1) {
      allSnippets[idx].shortcut = shortcut;
      allSnippets[idx].content = content;
      allSnippets[idx].folder = folder;
    }
  } else {
    allSnippets.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      shortcut,
      content,
      folder,
      usageCount: 0,
      createdAt: Date.now()
    });
  }

  await chrome.storage.local.set({ snippets: allSnippets });
  closeEditor();
  renderSnippets(allSnippets);
  updateLimitBanner();
}

async function deleteSnippet() {
  if (!editingSnippetId) return;
  allSnippets = allSnippets.filter(s => s.id !== editingSnippetId);
  await chrome.storage.local.set({ snippets: allSnippets });
  closeEditor();
  renderSnippets(allSnippets);
  updateLimitBanner();
}

function updateLimitBanner() {
  const banner = document.getElementById('limit-banner');
  const count = document.getElementById('snippet-count');
  if (!settings.isPro) {
    banner.style.display = 'flex';
    count.textContent = allSnippets.length;
  } else {
    banner.style.display = 'none';
  }
}

function showUpgradeModal() {
  document.getElementById('upgrade-modal').style.display = 'flex';
}

function handlePurchase() {
  window.location.href = 'activate.html';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
