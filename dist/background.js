const FREE_SNIPPET_LIMIT = 10;

chrome.runtime.onInstalled.addListener((details) => {
  // Open onboarding on first install
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/welcome.html') });
  }

  chrome.storage.local.get(['snippets', 'settings', 'stats'], (result) => {
    if (!result.snippets) {
      chrome.storage.local.set({
        snippets: [
          {
            id: generateId(),
            shortcut: '/hello',
            content: 'Hello! Thanks for reaching out. How can I help you today?',
            folder: 'Default',
            usageCount: 0,
            createdAt: Date.now()
          },
          {
            id: generateId(),
            shortcut: '/thanks',
            content: 'Thank you so much! I really appreciate your help with this.',
            folder: 'Default',
            usageCount: 0,
            createdAt: Date.now()
          },
          {
            id: generateId(),
            shortcut: '/sig',
            content: 'Best regards,\n{name}\n{email}',
            folder: 'Default',
            usageCount: 0,
            createdAt: Date.now()
          },
          {
            id: generateId(),
            shortcut: '/reply',
            content: 'Hi {cursor},\n\nThanks for your message. \n\nBest,\n{name}',
            folder: 'Default',
            usageCount: 0,
            createdAt: Date.now()
          },
          {
            id: generateId(),
            shortcut: '/meeting',
            content: 'Hi {cursor},\n\nWould you be available for a quick call on {day}? Let me know what time works for you.\n\nBest,\n{name}',
            folder: 'Default',
            usageCount: 0,
            createdAt: Date.now()
          }
        ]
      });
    }
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          triggerKey: 'Tab',
          expansionEnabled: true,
          isPro: false,
          theme: 'light'
        }
      });
    }
    if (!result.stats) {
      chrome.storage.local.set({
        stats: {
          totalExpansions: 0,
          keystrokesSaved: 0,
          installDate: Date.now()
        }
      });
    }
  });

  chrome.contextMenus.create({
    id: 'save-snippet',
    title: 'Save as SnapType snippet',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-snippet' && info.selectionText) {
    chrome.storage.local.get(['snippets', 'settings'], (result) => {
      const snippets = result.snippets || [];
      const settings = result.settings || {};
      if (!settings.isPro && snippets.length >= FREE_SNIPPET_LIMIT) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_TOAST',
          message: 'Free limit reached (10 snippets). Upgrade to Pro for unlimited!'
        });
        return;
      }
      const newSnippet = {
        id: generateId(),
        shortcut: '',
        content: info.selectionText,
        folder: 'Default',
        usageCount: 0,
        createdAt: Date.now()
      };
      snippets.push(newSnippet);
      chrome.storage.local.set({ snippets }, () => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_TOAST',
          message: 'Snippet saved! Open SnapType to set a shortcut.'
        });
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SNIPPETS') {
    chrome.storage.local.get(['snippets'], (result) => {
      sendResponse({ snippets: result.snippets || [] });
    });
    return true;
  }
  if (message.type === 'SNIPPET_USED') {
    chrome.storage.local.get(['snippets', 'stats'], (result) => {
      const snippets = result.snippets || [];
      const stats = result.stats || { totalExpansions: 0, keystrokesSaved: 0 };
      const idx = snippets.findIndex(s => s.id === message.snippetId);
      if (idx !== -1) {
        snippets[idx].usageCount = (snippets[idx].usageCount || 0) + 1;
        stats.totalExpansions++;
        stats.keystrokesSaved += (snippets[idx].content.length - snippets[idx].shortcut.length);
        chrome.storage.local.set({ snippets, stats });
        updateBadge(stats.totalExpansions);
      }
    });
  }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function updateBadge(count) {
  if (count > 0) {
    const text = count >= 1000 ? Math.floor(count / 1000) + 'k' : count.toString();
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  }
}

// Restore badge on startup
chrome.storage.local.get(['stats'], (result) => {
  const stats = result.stats || {};
  if (stats.totalExpansions) updateBadge(stats.totalExpansions);
});
