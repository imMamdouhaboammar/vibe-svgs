// SVG Items Data Store
const svgData = [
  // Mascots
  {
    id: 'claude-thinking',
    title: 'Claude Code (Deep Thinking)',
    category: 'mascots',
    path: 'svgs/mascots/claude-deep-thinking.svg',
    desc: 'Mascot reasoning deeply through 200k context with glowing brain waves.'
  },
  {
    id: 'antigravity-levitate',
    title: 'Google Antigravity Mascot',
    category: 'mascots',
    path: 'svgs/mascots/antigravity-levitating.svg',
    desc: 'Floating zero-gravity Gemini core with orbital energy rings.'
  },
  {
    id: 'cursor-autotab',
    title: 'Cursor Auto-Tab Rampage',
    category: 'mascots',
    path: 'svgs/mascots/cursor-autotab.svg',
    desc: 'Rapidly slamming TAB key to accept 5,000 multi-line AI edits.'
  },
  {
    id: 'chatgpt-hallucination',
    title: 'ChatGPT Confident Hallucination',
    category: 'mascots',
    path: 'svgs/mascots/chatgpt-hallucinating.svg',
    desc: 'Delivering fake facts with 100% authority and starry eyes.'
  },
  {
    id: 'copilot-ghost',
    title: 'Copilot Ghost Writer',
    category: 'mascots',
    path: 'svgs/mascots/copilot-ghost-writer.svg',
    desc: 'Ghostly assistant typing code suggestions at 3 AM.'
  },
  {
    id: 'devin-loop',
    title: "Devin's Infinite Self-Fix Loop",
    category: 'mascots',
    path: 'svgs/mascots/devin-infinite-loop.svg',
    desc: 'Trapped inside a hamster wheel running endless retries.'
  },

  // Badges
  {
    id: 'zero-human',
    title: '0% Code Written By Human',
    category: 'badges',
    path: 'svgs/badges/zero-human-code.svg',
    desc: 'Pulsing neon green badge certifying zero human keystrokes.'
  },
  {
    id: 'prompt-pray',
    title: 'Prompt & Pray Strategy',
    category: 'badges',
    path: 'svgs/badges/prompt-and-pray.svg',
    desc: 'Floating praying hands testing methodology badge.'
  },
  {
    id: 'context-exceeded',
    title: 'Context Window 99.9%',
    category: 'badges',
    path: 'svgs/badges/context-exceeded.svg',
    desc: 'Warning badge with pulsing red border and progress bar.'
  },
  {
    id: 'vibe-certified',
    title: 'Vibe Coding Certified',
    category: 'badges',
    path: 'svgs/badges/vibe-certified.svg',
    desc: 'Shimmering metallic gold standard certification badge.'
  },
  {
    id: 'ai-reviewer',
    title: 'AI Code Reviewer Approved',
    category: 'badges',
    path: 'svgs/badges/ai-reviewer-approved.svg',
    desc: 'Winking checkmark badge (It did not read the code).'
  },
  {
    id: 'refactored-claude',
    title: 'Refactored Legacy Code',
    category: 'badges',
    path: 'svgs/badges/refactored-by-claude.svg',
    desc: 'Animated flame burning away old code debt.'
  },
  {
    id: 'yolo-deploy',
    title: 'YOLO Production Deploy',
    category: 'badges',
    path: 'svgs/badges/yolo-deploy.svg',
    desc: 'Shaking rocket booster deploy badge.'
  },

  // Banners
  {
    id: 'vibe-arena',
    title: 'Vibe Coding Arena Hero',
    category: 'banners',
    path: 'svgs/banners/banner-vibe-coding-arena.svg',
    desc: 'Full-width dashboard arena with live indicators and AI agent status.'
  },
  {
    id: 'agentic-flow',
    title: 'Agentic Engineering Workflow',
    category: 'banners',
    path: 'svgs/banners/banner-agentic-workflow.svg',
    desc: 'Animated flowchart: Prompt ➔ Hallucination ➔ Loop ➔ Ship.'
  }
];

// Theme Palette colors for Custom Badge Generator
const themePalettes = {
  green: { labelBg: '#18181b', statusBg1: '#059669', statusBg2: '#10b981', textColor: '#ffffff' },
  cyan: { labelBg: '#0f172a', statusBg1: '#0284c7', statusBg2: '#06b6d4', textColor: '#ffffff' },
  purple: { labelBg: '#18181b', statusBg1: '#7c3aed', statusBg2: '#a855f7', textColor: '#ffffff' },
  gold: { labelBg: '#1e1b4b', statusBg1: '#d97706', statusBg2: '#fbbf24', textColor: '#451a03' },
  red: { labelBg: '#18181b', statusBg1: '#dc2626', statusBg2: '#f87171', textColor: '#ffffff' },
  pink: { labelBg: '#18181b', statusBg1: '#db2777', statusBg2: '#f43f5e', textColor: '#ffffff' }
};

let activeCategory = 'all';
let searchQuery = '';
let selectedTheme = 'green';

// Initialize Gallery
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
  setupFilterEvents();
  setupSearchEvent();
  setupCustomBadgeGenerator();
});

// Render Gallery Cards
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';

  const filtered = svgData.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No SVGs matched your search query.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${item.title}</h3>
        <span class="card-category">${item.category}</span>
      </div>
      <div class="card-preview">
        <img src="${item.path}" alt="${item.title}" loading="lazy" />
      </div>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">${item.desc}</p>
      <div class="card-actions">
        <button class="btn btn-secondary" onclick="copyMarkdown('${item.title}', '${item.path}')">📋 Markdown</button>
        <button class="btn btn-primary" onclick="downloadSVG('${item.path}')">📥 Download</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Filter button events
function setupFilterEvents() {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderGallery();
    });
  });
}

// Search input event
function setupSearchEvent() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGallery();
  });
}

// Copy Markdown Helper
window.copyMarkdown = (title, path) => {
  const rawUrl = `https://raw.githubusercontent.com/imMamdouhaboammar/vibe-svgs/main/${path}`;
  const markdown = `![${title}](${rawUrl})`;
  navigator.clipboard.writeText(markdown).then(() => {
    showToast('Markdown snippet copied to clipboard! 📋');
  });
};

// Download SVG Helper
window.downloadSVG = (path) => {
  const link = document.createElement('a');
  link.href = path;
  link.download = path.split('/').pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Show Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Custom Badge Generator
function setupCustomBadgeGenerator() {
  const labelInput = document.getElementById('badge-label');
  const statusInput = document.getElementById('badge-status');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const previewBox = document.getElementById('builder-svg-preview');

  function updateCustomBadge() {
    const labelText = labelInput.value || 'vibe coding';
    const statusText = statusInput.value || '100% UNCHECKED';
    const theme = themePalettes[selectedTheme];

    // Estimate width based on text length
    const labelWidth = Math.max(80, labelText.length * 8 + 20);
    const statusWidth = Math.max(100, statusText.length * 8 + 30);
    const totalWidth = labelWidth + statusWidth;

    const svgMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} 40" width="${totalWidth}" height="40">
  <defs>
    <linearGradient id="custom-badge-bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.statusBg1}" />
      <stop offset="100%" stop-color="${theme.statusBg2}" />
    </linearGradient>
  </defs>
  <style>
    .custom-label-bg { fill: ${theme.labelBg}; }
    .custom-status-bg { fill: url(#custom-badge-bg); }
    .custom-pulse { animation: custom-p 1.5s infinite ease-in-out alternate; }
    @keyframes custom-p { 0% { opacity: 0.5; } 100% { opacity: 1; } }
    .custom-text-l { font-family: system-ui, sans-serif; font-weight: 700; fill: #e4e4e7; font-size: 12px; }
    .custom-text-s { font-family: system-ui, sans-serif; font-weight: 800; fill: ${theme.textColor}; font-size: 12px; }
  </style>
  <path d="M6 0 H${labelWidth} V40 H6 A6 6 0 0 1 0 34 V6 A6 6 0 0 1 6 0 Z" class="custom-label-bg" />
  <path d="M${labelWidth} 0 H${totalWidth - 6} A6 6 0 0 1 ${totalWidth} 6 V34 A6 6 0 0 1 ${totalWidth - 6} 40 H${labelWidth} Z" class="custom-status-bg" />
  <text x="14" y="25" class="custom-text-l">${escapeHtml(labelText)}</text>
  <text x="${labelWidth + 14}" y="25" class="custom-text-s custom-pulse">${escapeHtml(statusText)}</text>
</svg>
    `.trim();

    previewBox.innerHTML = svgMarkup;
  }

  labelInput.addEventListener('input', updateCustomBadge);
  statusInput.addEventListener('input', updateCustomBadge);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTheme = btn.getAttribute('data-theme');
      updateCustomBadge();
    });
  });

  document.getElementById('copy-custom-markdown').addEventListener('click', () => {
    const svgCode = previewBox.innerHTML;
    navigator.clipboard.writeText(svgCode).then(() => {
      showToast('Custom SVG code copied to clipboard! 📋');
    });
  });

  document.getElementById('download-custom-svg').addEventListener('click', () => {
    const blob = new Blob([previewBox.innerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'custom-vibe-badge.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  updateCustomBadge();
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
